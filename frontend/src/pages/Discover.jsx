import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Bookmark, ThumbsDown, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal, UserPlus, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import FilterPopup from "@/components/FilterPopup";
import FullscreenViewer from "@/components/FullscreenViewer";

function ArtistCard({ item, onUpdate, onOpenViewer, onDislike, onOpenFilter }) {
  const [tatIdx, setTatIdx] = useState(0);
  const [heartPop, setHeartPop] = useState(0);
  const [direction, setDirection] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const tapRef = useRef({ last: 0, timer: null });

  const tattoos = Array.isArray(item.tattoos) ? item.tattoos : [];
  const tattoo = tattoos[tatIdx] || {};

  const triggerSave = async (showHeart = false) => {
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

  const handleTap = () => {
    const now = Date.now();
    if (now - tapRef.current.last < 320) {
      if (tapRef.current.timer) clearTimeout(tapRef.current.timer);
      tapRef.current.timer = null;
      tapRef.current.last = 0;
      triggerSave(true);
    } else {
      tapRef.current.last = now;
      if (tapRef.current.timer) clearTimeout(tapRef.current.timer);
      tapRef.current.timer = setTimeout(() => {
        onOpenViewer(tattoo);
        tapRef.current.timer = null;
      }, 320);
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

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/artists/${item.artist.user_id}/follow`);
      onUpdate({ ...item, is_following: data.following, follower_count: data.follower_count });
      toast.success(data.following ? "Takip ediliyor" : "Takipten çıkıldı");
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const goNext = () => {
    if (tatIdx < tattoos.length - 1) {
      setDirection(1);
      setTatIdx(tatIdx + 1);
      setDescExpanded(false);
    }
  };
  const goPrev = () => {
    if (tatIdx > 0) {
      setDirection(-1);
      setTatIdx(tatIdx - 1);
      setDescExpanded(false);
    }
  };

  const username =
    item.artist?.username ||
    item.artist?.email?.split("@")[0] ||
    item.artist?.name?.toLowerCase().replace(/\s+/g, "");
  const location = item.artist?.location || "İstanbul";

  return (
    <div className="relative w-full h-full snap-start overflow-hidden bg-zinc-950" data-testid={`feed-card-${item.artist.user_id}`}>
      {/* Vertical 9:16 image container — fills available space */}
      <div className="absolute inset-0 flex items-center justify-center bg-black" onClick={handleTap}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={tatIdx}
            src={tattoo.image}
            alt=""
            custom={direction}
            initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? "-25%" : "25%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) goNext();
              else if (info.offset.x > 80) goPrev();
            }}
            className="absolute inset-0 w-full h-full object-cover select-none"
            draggable={false}
            style={{ aspectRatio: "9 / 16" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/95 pointer-events-none" />
      </div>

      {/* Heart pop */}
      <AnimatePresence>
        {heartPop > 0 && (
          <motion.div
            key={heartPop}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1, 1.2], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85 }}
            onAnimationComplete={() => setHeartPop(0)}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <Heart className="w-32 h-32 fill-rose-500 text-rose-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP: Short description (clickable to expand) + hashtags */}
      <div className="absolute top-0 left-0 right-0 p-5 pt-7 z-20">
        {tattoo.description && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setDescExpanded(!descExpanded);
            }}
            data-testid={`desc-toggle-${tattoo.tattoo_id}`}
            className="w-full text-left mb-2"
            layout
          >
            <motion.p
              layout
              className={`text-sm text-zinc-100 leading-snug glass rounded-2xl px-3 py-2 border border-white/10 ${
                descExpanded ? "" : "line-clamp-1"
              }`}
            >
              {tattoo.description}
              {!descExpanded && tattoo.description.length > 40 && (
                <ChevronDown className="inline w-3 h-3 ml-1 opacity-60" />
              )}
            </motion.p>
          </motion.button>
        )}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-100 border border-rose-500/40 backdrop-blur-md">
            #{tattoo.style}
          </span>
          {tattoo.tags?.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-zinc-100 backdrop-blur-md"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Gallery dots */}
      {tattoos.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-3 flex flex-col gap-1 z-20 md:hidden">
          {tattoos.map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                i === tatIdx ? "h-6 bg-rose-500" : "h-3 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {tattoos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={tatIdx === 0}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass items-center justify-center disabled:opacity-30 z-20"
            data-testid={`gallery-prev-${item.artist.user_id}`}
          >
            <ChevronLeft className="w-5 h-5 text-zinc-100" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={tatIdx === tattoos.length - 1}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass items-center justify-center disabled:opacity-30 z-20"
            data-testid={`gallery-next-${item.artist.user_id}`}
          >
            <ChevronRight className="w-5 h-5 text-zinc-100" />
          </button>
        </>
      )}

      {/* RIGHT ACTION RAIL */}
      <div className="absolute right-4 bottom-32 md:bottom-40 z-20 flex flex-col gap-3 items-center">
        <ActionBtn
          testid={`like-btn-${tattoo.tattoo_id}`}
          icon={Heart}
          active={tattoo.liked}
          activeClass="fill-rose-500 text-rose-500"
          count={tattoo.like_count}
          onClick={handleLike}
        />
        <ActionBtn
          testid={`save-btn-${tattoo.tattoo_id}`}
          icon={Bookmark}
          active={tattoo.saved}
          activeClass="fill-rose-400 text-rose-400"
          onClick={() => triggerSave(true)}
        />
        <ActionBtn
          testid={`dislike-btn-${item.artist.user_id}`}
          icon={ThumbsDown}
          onClick={() => onDislike(item)}
        />
        {/* Filter button replaces message button */}
        <ActionBtn
          testid={`filter-action-btn`}
          icon={SlidersHorizontal}
          onClick={() => onOpenFilter()}
        />
      </div>

      {/* BOTTOM: Artist row + Follow */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 md:pb-4 z-20">
        <div className="flex items-center gap-3">
          <Link
            to={`/app/artist/${item.artist.user_id}`}
            className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-rose-500/40 overflow-hidden flex items-center justify-center flex-shrink-0"
          >
            {item.artist.picture ? (
              <img src={item.artist.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-black text-zinc-100">
                {item.artist.name?.[0]?.toUpperCase()}
              </span>
            )}
          </Link>
          <Link
            to={`/app/artist/${item.artist.user_id}`}
            className="flex-1 min-w-0"
            data-testid={`artist-row-${item.artist.user_id}`}
          >
            <div className="font-display font-black text-zinc-50 text-base truncate leading-tight" data-testid={`artist-name-${item.artist.user_id}`}>
              {item.artist.name}
            </div>
            <div className="text-xs text-zinc-400 truncate font-mono">
              @{username}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-300/80 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{location}</span>
            </div>
          </Link>
          <motion.button
            whileTap={{ scale: 0.92 }}
            data-testid={`follow-btn-${item.artist.user_id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleFollow();
            }}
            className={`px-4 py-2 rounded-full text-xs font-display font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              item.is_following
                ? "bg-zinc-900/70 text-zinc-300 border border-zinc-700"
                : "bg-gradient-to-r from-rose-500 to-indigo-600 text-white glow-rose"
            }`}
          >
            <UserPlus className="w-3 h-3" />
            {item.is_following ? "Takipte" : "Takip Et"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ testid, icon: Icon, active, activeClass, count, onClick }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.button
        data-testid={testid}
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.08 }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="w-12 h-12 rounded-full glass flex items-center justify-center border border-white/10"
      >
        <Icon className={`w-5 h-5 transition-colors ${active ? activeClass : "text-zinc-100"}`} />
      </motion.button>
      {count !== undefined && (
        <span className="text-[10px] font-mono font-bold text-zinc-200">{count}</span>
      )}
    </div>
  );
}

export default function Discover() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [filter, setFilter] = useState({ value: "all", label: "Tümü" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [hidden, setHidden] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { exclude_following: true };
      if (filter.value && filter.value !== "all") params.q = filter.value;
      const { data } = await api.get("/feed", { params });
      setItems(
        Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              tattoos: Array.isArray(item?.tattoos) ? item.tattoos : [],
              artist: item?.artist || {},
            }))
          : [],
      );
    } catch {
      toast.error("Akış yüklenemedi");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = (next) => {
    setItems((prev) => prev.map((p) => (p.artist.user_id === next.artist.user_id ? next : p)));
  };

  const handleDislike = (item) => {
    setHidden((s) => new Set(s).add(item.artist.user_id));
    toast.message("Daha az göster", { description: item.artist.name });
  };

  const visible = items.filter((i) => Array.isArray(i.tattoos) && i.tattoos.length > 0 && !hidden.has(i.artist.user_id));

  return (
    <>
      {/* Top filter chip (also accessible from right rail) */}
      <motion.button
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 260 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setFilterOpen(true)}
        data-testid="discover-filter-btn"
        className="absolute top-3 right-3 z-30 glass border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg"
      >
        <SlidersHorizontal className="w-3 h-3 text-rose-300" />
        <span className="text-[11px] font-display font-bold text-zinc-100">{filter.label}</span>
      </motion.button>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-10 h-10 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-zinc-500 font-mono text-sm mb-2">Bu kriterlerde sanatçı bulunamadı</div>
          <p className="text-zinc-600 text-sm">Filtreyi değiştir veya tümünü göster.</p>
        </div>
      ) : (
        <div className="snap-feed no-scrollbar h-full bg-zinc-950" data-testid="discover-feed">
          {visible.map((item) => (
            <div key={item.artist.user_id} className="h-full w-full relative">
              <ArtistCard
                item={item}
                onUpdate={handleUpdate}
                onOpenViewer={setViewer}
                onDislike={handleDislike}
                onOpenFilter={() => setFilterOpen(true)}
              />
            </div>
          ))}
        </div>
      )}

      <FilterPopup
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filter.value}
        onChange={setFilter}
      />

      <FullscreenViewer src={viewer?.image} onClose={() => setViewer(null)} />
    </>
  );
}
