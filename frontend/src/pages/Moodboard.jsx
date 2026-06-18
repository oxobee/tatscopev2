import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, X, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Moodboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/moodboard");
      setItems(data);
    } catch {
      toast.error("Panom yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (tattooId) => {
    try {
      await api.post(`/tattoos/${tattooId}/save`); // toggle off
      setItems((prev) => prev.filter((x) => x.tattoo.tattoo_id !== tattooId));
      toast.message("Panomdan çıkarıldı");
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-5 pb-24" data-testid="moodboard-page">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Bookmark className="w-5 h-5 text-rose-400" />
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-zinc-500">
            Moodboard
          </span>
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight">
          <span className="text-gradient">Panom</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-2">Beğendiğin tüm dövmeler tek yerde.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20" data-testid="moodboard-empty">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-zinc-900 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-zinc-700" />
          </div>
          <p className="text-zinc-400 text-sm">Henüz hiçbir dövme kaydetmedin.</p>
          <Link
            to="/app/discover"
            className="inline-block mt-4 text-rose-400 hover:text-rose-300 font-bold text-sm"
          >
            Keşfetmeye başla →
          </Link>
        </div>
      ) : (
        <div className="columns-2 gap-3 space-y-3">
          {items.map(({ tattoo, artist }) => (
            <motion.div
              key={tattoo.tattoo_id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-zinc-900"
              data-testid={`moodboard-item-${tattoo.tattoo_id}`}
            >
              <div className="relative w-full" style={{ aspectRatio: "9 / 16" }}>
                <img
                  src={tattoo.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  onClick={() => setViewer(tattoo)}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <Link
                  to={`/app/artist/${artist?.user_id}`}
                  className="text-xs font-bold text-zinc-100 truncate hover:text-rose-400"
                >
                  {artist?.name}
                </Link>
                <div className="text-[10px] text-zinc-400 capitalize">{tattoo.style}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(tattoo.tattoo_id);
                }}
                data-testid={`moodboard-remove-${tattoo.tattoo_id}`}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-zinc-950/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
            onClick={() => setViewer(null)}
          >
            <button
              onClick={() => setViewer(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full glass flex items-center justify-center"
            >
              <X className="w-5 h-5 text-zinc-100" />
            </button>
            <img src={viewer.image} alt="" className="max-w-full max-h-full rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
