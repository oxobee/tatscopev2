import { useState } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Edit, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    picture: user?.picture || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", form);
      setUser(data);
      toast.success("Profil güncellendi");
      setOpen(false);
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-5 pb-24" data-testid="profile-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8 pt-8">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center overflow-hidden mb-4">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-4xl font-black text-white">
                {user.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-50" data-testid="profile-name">
            {user.name}
          </h1>
          <div className="text-sm text-rose-400 font-bold uppercase tracking-wider mt-1">
            {user.role === "artist" ? "Sanatçı" : "Kullanıcı"}
          </div>
          {user.location && (
            <div className="text-xs text-zinc-500 mt-2 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {user.location}
            </div>
          )}
        </div>

        {user.bio && (
          <div className="glass rounded-2xl p-5 mb-4">
            <p className="text-sm text-zinc-300 leading-relaxed">{user.bio}</p>
          </div>
        )}

        <div className="glass rounded-2xl p-5 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400">{user.email}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-zinc-600">
            ID: {user.user_id}
          </div>
        </div>

        <div className="space-y-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="profile-edit-btn"
                variant="outline"
                className="w-full h-12 rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800 font-display font-bold"
              >
                <Edit className="w-4 h-4 mr-2" />
                Profili Düzenle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="font-display">Profili Düzenle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">İsim</Label>
                  <Input
                    data-testid="profile-name-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">Bio</Label>
                  <Textarea
                    data-testid="profile-bio-input"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">Lokasyon</Label>
                  <Input
                    data-testid="profile-location-input"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">Profil fotoğrafı URL</Label>
                  <Input
                    data-testid="profile-picture-input"
                    value={form.picture}
                    onChange={(e) => setForm({ ...form, picture: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 mt-1"
                  />
                </div>
                <Button
                  data-testid="profile-save-btn"
                  onClick={submit}
                  disabled={saving}
                  className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            data-testid="profile-logout-btn"
            onClick={handleLogout}
            variant="ghost"
            className="w-full h-12 rounded-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-display font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
