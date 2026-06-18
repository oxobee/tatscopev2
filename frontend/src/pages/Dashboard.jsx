import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Palette, Upload, Trash2, Plus, MapPin, Instagram, Phone, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const STYLES = [
  { v: "minimal", l: "Minimal" },
  { v: "blackwork", l: "Blackwork" },
  { v: "traditional", l: "Geleneksel" },
  { v: "realism", l: "Realism" },
  { v: "geometric", l: "Geometrik" },
  { v: "fineline", l: "Fineline" },
  { v: "watercolor", l: "Suluboya" },
];

function UploadDialog({ onUploaded }) {
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState("");
  const [form, setForm] = useState({
    description: "",
    tags: "",
    style: "minimal",
    color: "black",
    size: "medium",
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya 5MB'tan büyük olamaz");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!image) {
      toast.error("Görsel seçmelisin");
      return;
    }
    setUploading(true);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const r = await api.post("/tattoos", { ...form, image, tags });
      toast.success("Dövme eklendi");
      onUploaded(r.data);
      setOpen(false);
      setImage("");
      setForm({ description: "", tags: "", style: "minimal", color: "black", size: "medium" });
    } catch (e) {
      toast.error("Yükleme başarısız");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid="upload-open-btn"
          className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold glow-rose"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dövme Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md" data-testid="upload-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Yeni Dövme</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image picker */}
          <div
            className="aspect-square bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-rose-500/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Görsel seç</p>
                <p className="text-xs text-zinc-700 mt-1">Max 5MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              data-testid="upload-file-input"
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          <Textarea
            data-testid="upload-description-input"
            placeholder="Açıklama (opsiyonel)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />

          <Input
            data-testid="upload-tags-input"
            placeholder="Etiketler, virgülle ayır (örn: minimal, kuş, fineline)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500">Stil</Label>
              <Select value={form.style} onValueChange={(v) => setForm({ ...form, style: v })}>
                <SelectTrigger data-testid="upload-style-select" className="bg-zinc-900 border-zinc-800 text-zinc-100 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  {STYLES.map((s) => (
                    <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500">Renk</Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger data-testid="upload-color-select" className="bg-zinc-900 border-zinc-800 text-zinc-100 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectItem value="black">Siyah/Gri</SelectItem>
                  <SelectItem value="color">Renkli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500">Boyut</Label>
              <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
                <SelectTrigger data-testid="upload-size-select" className="bg-zinc-900 border-zinc-800 text-zinc-100 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectItem value="small">Küçük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="large">Büyük</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            data-testid="upload-submit-btn"
            onClick={submit}
            disabled={uploading}
            className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold"
          >
            {uploading ? "Yükleniyor..." : "Yayınla"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StudioEditor({ user, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    studio_name: user.studio_name || "",
    bio: user.bio || "",
    location: user.location || "",
    instagram: user.instagram || "",
    contact: user.contact || "",
    picture: user.picture || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const r = await api.put("/artists/me", form);
      onUpdate(r.data);
      toast.success("Studio bilgileri güncellendi");
      setOpen(false);
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid="studio-edit-btn"
          variant="outline"
          className="h-11 rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
        >
          <Edit className="w-4 h-4 mr-2" />
          Studio Bilgileri
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Studio Bilgileri</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            data-testid="studio-name-input"
            placeholder="İsim"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Input
            data-testid="studio-studio-name-input"
            placeholder="Studio adı"
            value={form.studio_name}
            onChange={(e) => setForm({ ...form, studio_name: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Textarea
            data-testid="studio-bio-input"
            placeholder="Kısa bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Input
            data-testid="studio-location-input"
            placeholder="Lokasyon"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Input
            data-testid="studio-instagram-input"
            placeholder="Instagram @kullanici"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Input
            data-testid="studio-contact-input"
            placeholder="İletişim (telefon/email)"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Input
            data-testid="studio-picture-input"
            placeholder="Profil fotoğrafı URL"
            value={form.picture}
            onChange={(e) => setForm({ ...form, picture: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
          <Button
            data-testid="studio-save-btn"
            onClick={submit}
            disabled={saving}
            className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [tattoos, setTattoos] = useState([]);
  const [stats, setStats] = useState({ followers: 0, likes: 0, rating: 0 });

  const load = async () => {
    try {
      const r = await api.get(`/artists/${user.user_id}`);
      setTattoos(r.data.tattoos);
      setStats({
        followers: r.data.follower_count,
        rating: r.data.rating_avg,
        likes: r.data.tattoos.reduce((s, t) => s + (t.like_count || 0), 0),
      });
    } catch {}
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bu dövmeyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/tattoos/${id}`);
      setTattoos((prev) => prev.filter((t) => t.tattoo_id !== id));
      toast.success("Silindi");
    } catch {
      toast.error("Silinemedi");
    }
  };

  if (user?.role !== "artist") {
    return (
      <div className="p-8 text-center" data-testid="studio-not-artist">
        <Palette className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">Stüdyo yalnızca sanatçılar içindir.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-5 pb-24" data-testid="studio-dashboard">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-rose-400" />
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-zinc-500">
            Sanatçı Paneli
          </span>
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight">
          <span className="text-zinc-50">Stüdyon, </span>
          <span className="text-gradient">{user.name?.split(" ")[0]}</span>
        </h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass rounded-2xl p-4 text-center" data-testid="studio-stat-followers">
          <div className="font-display text-2xl font-black text-zinc-50">{stats.followers}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Takipçi</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center" data-testid="studio-stat-tattoos">
          <div className="font-display text-2xl font-black text-zinc-50">{tattoos.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Eser</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center" data-testid="studio-stat-rating">
          <div className="font-display text-2xl font-black text-zinc-50">
            {(stats.rating || 0).toFixed(1)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Puan</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <UploadDialog onUploaded={(t) => setTattoos((prev) => [t, ...prev])} />
        <StudioEditor user={user} onUpdate={setUser} />
      </div>

      {/* Studio info preview */}
      <div className="glass rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">Profil</div>
        {user.bio && <p className="text-sm text-zinc-300 mb-3">{user.bio}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
          {user.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.location}</span>}
          {user.instagram && <span className="flex items-center gap-1"><Instagram className="w-3 h-3" />{user.instagram}</span>}
          {user.contact && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.contact}</span>}
        </div>
      </div>

      {/* Portfolio */}
      <h3 className="font-display font-bold text-sm tracking-wide uppercase text-zinc-300 mb-3">
        Portföyün
      </h3>
      {tattoos.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl" data-testid="studio-portfolio-empty">
          <Palette className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Henüz dövme yok. İlk eserini yükle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {tattoos.map((t) => (
            <motion.div
              key={t.tattoo_id}
              layout
              className="aspect-square bg-zinc-900 rounded-xl overflow-hidden relative group"
              data-testid={`studio-tattoo-${t.tattoo_id}`}
            >
              <img src={t.image} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(t.tattoo_id)}
                data-testid={`studio-delete-${t.tattoo_id}`}
                className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-zinc-950/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
