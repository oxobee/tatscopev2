import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Bookmark, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import FullscreenViewer from "@/components/FullscreenViewer";

export default function FollowingFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/feed/following");
      setItems(data);
    } catch {
      toast.error("Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (idx, kind) => {
    const item = items[idx];
    const ep = kind === "like" ? "like" : "save";
    try {
      const { data } = await api.post(`/tattoos/${item.tattoo.tattoo_id}/${ep}`);
      setItems((prev) =>
        prev.map((p, i) =>
          i === idx
            ? {
                ...p,
                tattoo: {
                  ...p.tattoo,
                  liked: kind === "like" ? data.liked : p.tattoo.liked,
                  like_count: kind === "like" ? data.like_count : p.tattoo.like_count,
                  saved: kind === "save" ? data.saved : p.tattoo.saved,
                },
              }
            : p
        )
      );
    } catch {}
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28" data-testid="following-feed-page">
      <header className="px-5 pt-5 pb-3 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">
            Takip Akışı
          </span>
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-zinc-50">
          Sevdiklerinden Son Paylaşımlar
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 px-5" data-testid="following-feed-empty">
          <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm mb-3">
            Henüz kimseyi takip etmiyorsun. Keşfet'e git ve sevdiğin sanatçıları takip et.
          </p>
          <Link to="/app/discover" className="text-rose-400 hover:text-rose-300 font-bold text-sm">
            Keşfet'e git →
          </Link>
        </div>
      ) : (
        <div className="p-3 space-y-4">
          {items.map((it, idx) => (
            <motion.article
              key={it.tattoo.tattoo_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden"
              data-testid={`following-card-${it.tattoo.tattoo_id}`}
            >
              {/* Artist row */}
              <Link
                to={`/app/artist/${it.artist?.user_id}`}
                className="flex items-center gap-3 p-3 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                  {it.artist?.picture ? (
                    <img src={it.artist.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-zinc-100 text-sm">
                      {it.artist?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm text-zinc-50 truncate">
                    {it.artist?.name}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <MapPin className="w-3 h-3" /> {it.artist?.location || "—"}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-zinc-600">
                  {new Date(it.tattoo.created_at).toLocaleDateString("tr-TR")}
                </div>
              </Link>

              {/* Image */}
              <button onClick={() => setViewer(it.tattoo)} className="w-full block">
                <img src={it.tattoo.image} alt="" className="w-full max-h-[420px] object-cover" />
              </button>

              {/* Actions */}
              <div className="flex items-center gap-2 p-3">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  data-testid={`follow-like-${it.tattoo.tattoo_id}`}
                  onClick={() => toggle(idx, "like")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800"
                >
                  <Heart
                    className={`w-4 h-4 ${it.tattoo.liked ? "fill-rose-500 text-rose-500" : "text-zinc-300"}`}
                  />
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {it.tattoo.like_count}
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  data-testid={`follow-save-${it.tattoo.tattoo_id}`}
                  onClick={() => toggle(idx, "save")}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800"
                >
                  <Bookmark
                    className={`w-4 h-4 ${it.tattoo.saved ? "fill-rose-400 text-rose-400" : "text-zinc-300"}`}
                  />
                </motion.button>
                <div className="flex-1" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 capitalize">
                  {it.tattoo.style}
                </span>
              </div>
              {it.tattoo.description && (
                <p className="px-4 pb-4 text-sm text-zinc-300">{it.tattoo.description}</p>
              )}
            </motion.article>
          ))}
        </div>
      )}

      <FullscreenViewer src={viewer?.image} onClose={() => setViewer(null)} />
    </div>
  );
}
