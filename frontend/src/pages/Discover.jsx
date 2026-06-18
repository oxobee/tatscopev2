import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Bookmark, UserPlus, MapPin, Instagram, MessageCircle, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

function ArtistCard({ item, onUpdate, onOpenViewer }) {
  const [tatIdx, setTatIdx] = useState(0);
  const [heartPop, setHeartPop] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const tattoo = item.tattoos[tatIdx];

  const handleTap = (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // double tap
      handleSave(true);
    } else {
      setLastTap(now);
      // single tap with delay — open viewer if not followed by another tap
      setTimeout(() => {
        if (Date.now() - now > 250) {
          onOpenViewer(tattoo);
        }
      }, 280);
    }
  };

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/tattoos/${tattoo.tattoo_id}/like`);
      const next = { ...item };
      next.tattoos = next.tattoos.map((t, i) =>
        i === tatIdx ? { ...t, liked: data.liked, like_count: data.like_count } : t
      );
      onUpdate(next);
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleSave = async (showHeart = false) => {
    try {
      const { data } = await api.post(`/tattoos/${tattoo.tattoo_id}/save`);
      const next = { ...item };
      next.tattoos = next.tattoos.map((t, i) => (i === tatIdx ? { ...t, saved: data.saved } : t));
      onUpdate(next);
      if (data.saved && showHeart) {
        setHeartPop(Date.now());
        toast.success("Panom'a eklendi");
      } else if (!data.saved && showHeart) {
        toast.message("Panom'dan çıkarıldı");
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/artists/${item.artist.user_id}/follow`);
      onUpdate({ ...item, is_following: data.following, follower_count: data.follower_count });
      toast.success(data.following ? "Takip ediliyor" : "Takipten çıkıldı");
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  return (
    <div className="relative w-full h-full snap-start" data-testid={`feed-card-${item.artist.user_id}`}>
      {/* Image */}
      <div className="absolute inset-0 bg-zinc-900" onClick={handleTap}>
        <img
          src={tattoo.image}
          alt=""
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />
      </div>

      {/* Heart pop animation */}
      <AnimatePresence>
        {heartPop > 0 && (
          <motion.div
            key={heartPop}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1, 1.2], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            onAnimationComplete={() => setHeartPop(0)}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-32 h-32 fill-rose-500 text-rose-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 p-5 z-20">
        <div className="flex items-center gap-3">
          <Link to={`/app/artist/${item.artist.user_id}`} className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-rose-500/40 overflow-hidden flex items-center justify-center">
            {item.artist.picture ? (
              <img src={item.artist.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-black text-zinc-100">
                {item.artist.name?.[0]?.toUpperCase()}
              </span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/app/artist/${item.artist.user_id}`} className="block">
              <div className="font-display font-black text-zinc-50 text-base truncate" data-testid={`artist-name-${item.artist.user_id}`}>
                {item.artist.name}
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-300/80">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{item.artist.location || item.artist.studio_name || "İstanbul"}</span>
              </div>
            </Link>
          </div>
          <button
            data-testid={`follow-btn-${item.artist.user_id}`}
            onClick={handleFollow}
            className={`px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
              item.is_following
                ? "bg-zinc-900/70 text-zinc-300 border border-zinc-700"
                : "bg-gradient-to-r from-rose-500 to-indigo-600 text-white glow-rose"
            }`}
          >
            {item.is_following ? "Takipte" : "Takip Et"}
          </button>
        </div>
      </div>

      {/* Gallery dots */}
      {item.tattoos.length > 1 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {item.tattoos.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === tatIdx ? "w-6 bg-rose-500" : "w-3 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Gallery arrows */}
      {item.tattoos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTatIdx(Math.max(0, tatIdx - 1));
            }}
            disabled={tatIdx === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center disabled:opacity-30 z-20"
            data-testid={`gallery-prev-${item.artist.user_id}`}
          >
            <ChevronLeft className="w-5 h-5 text-zinc-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTatIdx(Math.min(item.tattoos.length - 1, tatIdx + 1));
            }}
            disabled={tatIdx === item.tattoos.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center disabled:opacity-30 z-20"
            data-testid={`gallery-next-${item.artist.user_id}`}
          >
            <ChevronRight className="w-5 h-5 text-zinc-100" />
          </button>
        </>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            {tattoo.description && (
              <p className="text-sm text-zinc-200 mb-2 line-clamp-2">{tattoo.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {tattoo.style}
              </span>
              {tattoo.tags?.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <button
              data-testid={`like-btn-${tattoo.tattoo_id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  tattoo.liked ? "fill-rose-500 text-rose-500" : "text-zinc-100"
                }`}
              />
            </button>
            <span className="text-[11px] font-mono font-bold text-zinc-200">{tattoo.like_count}</span>

            <button
              data-testid={`save-btn-${tattoo.tattoo_id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSave(true);
              }}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Bookmark
                className={`w-5 h-5 transition-colors ${
                  tattoo.saved ? "fill-rose-400 text-rose-400" : "text-zinc-100"
                }`}
              />
            </button>

            <Link
              to={`/app/artist/${item.artist.user_id}`}
              data-testid={`view-artist-${item.artist.user_id}`}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-5 h-5 text-zinc-100" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Discover() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/feed");
      setItems(data);
    } catch {
      toast.error("Akış yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = (next) => {
    setItems((prev) =>
      prev.map((p) => (p.artist.user_id === next.artist.user_id ? next : p))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-zinc-500 font-mono text-sm mb-2">Henüz akış boş</div>
        <p className="text-zinc-600 text-sm">Yakında sanatçılar burada görünecek.</p>
      </div>
    );
  }

  return (
    <>
      <div className="snap-feed no-scrollbar h-full bg-zinc-950" data-testid="discover-feed">
        {items.map((item) => (
          <div key={item.artist.user_id} className="h-full w-full relative">
            <ArtistCard item={item} onUpdate={handleUpdate} onOpenViewer={setViewer} />
          </div>
        ))}
      </div>

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="image-viewer"
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
            onClick={() => setViewer(null)}
          >
            <button
              data-testid="image-viewer-close"
              onClick={() => setViewer(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full glass flex items-center justify-center"
            >
              <X className="w-5 h-5 text-zinc-100" />
            </button>
            <motion.img
              src={viewer.image}
              alt=""
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
