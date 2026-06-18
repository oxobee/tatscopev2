import { useState } from "react";
import { Settings, Save, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SettingsDialog({ trigger }) {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");

  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    phone: user?.phone || "",
    birthday: user?.birthday || "",
    picture: user?.picture || "",
  });

  const [pwd, setPwd] = useState({ current_password: "", new_password: "" });

  if (!user) return null;

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", form);
      setUser(data);
      toast.success("Bilgilerin güncellendi");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const changePwd = async () => {
    setSaving(true);
    try {
      await api.put("/users/me/password", pwd);
      toast.success("Şifre güncellendi");
      setPwd({ current_password: "", new_password: "" });
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            data-testid="settings-open-btn"
            variant="outline"
            className="rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800 h-10 px-4 font-display font-bold text-xs"
          >
            <Settings className="w-3.5 h-3.5 mr-2" />
            Ayarlar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md max-h-[85vh] overflow-y-auto" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Ayarlar</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 bg-zinc-900 rounded-full p-1 w-fit mb-4">
          {[
            { v: "profile", l: "Profil" },
            { v: "account", l: "Hesap" },
            { v: "security", l: "Şifre" },
          ].map((t) => (
            <button
              key={t.v}
              data-testid={`settings-tab-${t.v}`}
              onClick={() => setTab(t.v)}
              className={`px-4 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                tab === t.v ? "bg-zinc-50 text-zinc-950" : "text-zinc-400"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="space-y-3">
            <Field label="Ad Soyad">
              <Input data-testid="settings-name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Field label="Kullanıcı Adı">
              <Input data-testid="settings-username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="@kullaniciadi" className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Field label="Bio">
              <Textarea data-testid="settings-bio" value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3} className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Field label="Profil Fotoğrafı URL">
              <Input data-testid="settings-picture" value={form.picture}
                onChange={(e) => setForm({ ...form, picture: e.target.value })}
                className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Button onClick={submit} disabled={saving} data-testid="settings-save-profile"
              className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Kaydet</>}
            </Button>
          </div>
        )}

        {tab === "account" && (
          <div className="space-y-3">
            <Field label="E-posta">
              <Input value={user.email} disabled className="bg-zinc-900 border-zinc-800 text-zinc-500" />
            </Field>
            <Field label="Telefon">
              <Input data-testid="settings-phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+90 555 ..." className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Field label="Doğum Tarihi">
              <Input data-testid="settings-birthday" type="date" value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Field label="Konum (Şehir, İlçe)">
              <Input data-testid="settings-location" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Kadıköy, İstanbul" className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Button onClick={submit} disabled={saving} data-testid="settings-save-account"
              className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Kaydet</>}
            </Button>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-3">
            <Field label="Mevcut Şifre">
              <Input data-testid="settings-current-pwd" type="password" value={pwd.current_password}
                onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
                className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Field label="Yeni Şifre">
              <Input data-testid="settings-new-pwd" type="password" value={pwd.new_password}
                onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                minLength={6} className="bg-zinc-900 border-zinc-800" />
            </Field>
            <Button onClick={changePwd} disabled={saving || !pwd.current_password || !pwd.new_password}
              data-testid="settings-change-pwd-btn"
              className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4 mr-2" /> Şifreyi Güncelle</>}
            </Button>
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Sosyal giriş kullandıysan şifre değiştirilemez.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
