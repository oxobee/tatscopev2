import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Brush, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { registerWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await registerWithCredentials(form);
      toast.success(`Hoş geldin ${u.name}! Hesabın oluşturuldu.`);
      navigate(u.role === "artist" ? "/app/studio" : "/app/discover");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const RoleCard = ({ value, icon: Icon, label, desc }) => {
    const active = form.role === value;
    return (
      <button
        type="button"
        data-testid={`register-role-${value}`}
        onClick={() => setForm({ ...form, role: value })}
        className={`relative p-5 rounded-2xl text-left transition-all border ${
          active
            ? "bg-gradient-to-br from-rose-500/15 to-indigo-600/15 border-rose-500/40"
            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
        }`}
      >
        <Icon
          className={`w-6 h-6 mb-3 ${active ? "text-rose-400" : "text-zinc-400"}`}
        />
        <div className="font-display font-bold text-zinc-100">{label}</div>
        <div className="text-xs text-zinc-500 mt-1">{desc}</div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col" data-testid="register-screen">
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h1 className="font-display text-5xl font-black tracking-tight">
              <span className="text-zinc-50">Aramıza</span>{" "}
              <span className="text-gradient">katıl.</span>
            </h1>
            <p className="text-zinc-500 mt-3 text-sm">Önce hesabını oluştur, sonra rolünü seç.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <RoleCard
              value="user"
              icon={User}
              label="Kullanıcı"
              desc="Dövme arıyorum"
            />
            <RoleCard
              value="artist"
              icon={Brush}
              label="Sanatçı"
              desc="Portfolyo paylaşıyorum"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500">
                İsim
              </Label>
              <Input
                data-testid="register-name-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.role === "artist" ? "Studio veya tam isim" : "Tam isim"}
                className="h-12 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  data-testid="register-email-input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ornek@email.com"
                  className="h-12 pl-11 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  data-testid="register-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="En az 6 karakter"
                  className="h-12 pl-11 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div data-testid="register-error" className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              data-testid="register-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full h-13 py-3.5 rounded-full font-display text-base font-bold bg-gradient-to-br from-rose-500 to-indigo-600 hover:opacity-90 glow-rose"
            >
              {submitting ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-900" />
            <span className="text-zinc-600 text-xs uppercase tracking-widest">veya</span>
            <div className="h-px flex-1 bg-zinc-900" />
          </div>

          <Button
            data-testid="register-google-btn"
            onClick={handleGoogle}
            variant="outline"
            className="w-full h-12 rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
          >
            Google ile kayıt ol
          </Button>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Zaten hesabın var mı?{" "}
            <Link
              data-testid="register-go-login"
              to="/login"
              className="text-rose-400 hover:text-rose-300 font-semibold"
            >
              Giriş Yap
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
