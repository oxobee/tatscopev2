import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await loginWithCredentials(email, password);
      toast.success(`Hoş geldin, ${u.name}`);
      navigate(u.role === "artist" ? "/app/studio" : "/app/discover");
    } catch (err) {
      const msg = formatApiError(err.response?.data?.detail) || err.message;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col" data-testid="login-screen">
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <h1 className="font-display text-5xl font-black tracking-tight">
              <span className="text-gradient">Tekrar</span>{" "}
              <span className="text-zinc-50">hoş geldin.</span>
            </h1>
            <p className="text-zinc-500 mt-3 text-sm">Hesabına giriş yap ve keşfetmeye devam et.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  data-testid="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  data-testid="login-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pl-11 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div
                data-testid="login-error"
                className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg p-3"
              >
                {error}
              </div>
            )}

            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full h-13 py-3.5 rounded-full font-display text-base font-bold bg-gradient-to-br from-rose-500 to-indigo-600 hover:opacity-90 glow-rose"
            >
              {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-900" />
            <span className="text-zinc-600 text-xs uppercase tracking-widest">veya</span>
            <div className="h-px flex-1 bg-zinc-900" />
          </div>

          <Button
            data-testid="login-google-btn"
            onClick={handleGoogle}
            variant="outline"
            className="w-full h-12 rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".9"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".8"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".7"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".95"/>
            </svg>
            Google ile devam et
          </Button>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Hesabın yok mu?{" "}
            <Link
              data-testid="login-go-register"
              to="/register"
              className="text-rose-400 hover:text-rose-300 font-semibold"
            >
              Kayıt Ol
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
