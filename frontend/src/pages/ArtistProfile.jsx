import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Instagram, Phone, Star, UserPlus, ArrowLeft, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ArtistProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("portfolio");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/artists/${id}`);
      setData(data);
      const c = await api.get(`/artists/${id}/comments`);
      setComments(c.data);
    } catch {
      toast.error("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleFollow = async () => {
    try {
      const r = await api.post(`/artists/${id}/follow`);
      setData((prev) => ({
        ...prev,
        is_following: r.data.following,
        follower_count: r.data.follower_count,
      }));
    } catch {}
  };

  const handleRate = async (stars) => {
    try {
      const r = await api.post(`/artists/${id}/rating`, { stars });
      setData((prev) => ({
        ...prev,
        rating_avg: r.data.rating_avg,
        rating_count: r.data.rating_count,
        my_rating: r.data.my_rating,
      }));
      toast.success(`${stars} yıldız verildi`);
    } catch {
      toast.error("Puan verilemedi");
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const r = await api.post(`/artists/${id}/comments`, { text: newComment });
      setComments((prev) => [r.data, ...prev]);
      setNewComment("");
      toast.success("Yorum eklendi");
    } catch {
      toast.error("Yorum eklenemedi");
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  const { artist, tattoos, follower_count, rating_avg, rating_count, is_following, my_rating } = data;
  const isMine = user?.user_id === artist.user_id;

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24" data-testid="artist-profile-page">
      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-rose-500/30 via-zinc-900 to-indigo-600/30">
        {tattoos[0]?.image && (
          <img
            src={tattoos[0].image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-zinc-950" />
        <Link
          to="/app/discover"
          className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center z-10"
          data-testid="profile-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-100" />
        </Link>
      </div>

      {/* Header */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 rounded-2xl bg-zinc-800 border-4 border-zinc-950 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {artist.picture ? (
              <img src={artist.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-black text-3xl text-zinc-100">
                {artist.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="font-display text-2xl font-black tracking-tight text-zinc-50 truncate" data-testid="profile-artist-name">
              {artist.name}
            </h1>
            {artist.studio_name && (
              <div className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-0.5">
                {artist.studio_name}
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mb-4">
          {artist.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{artist.location}</span>
            </div>
          )}
          {artist.instagram && (
            <a
              href={`https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-rose-400"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>{artist.instagram}</span>
            </a>
          )}
          {artist.contact && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{artist.contact}</span>
            </div>
          )}
        </div>

        {artist.bio && <p className="text-sm text-zinc-300 leading-relaxed mb-4">{artist.bio}</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center">
            <div className="font-display text-2xl font-black text-zinc-50">{tattoos.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Eser</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-black text-zinc-50" data-testid="profile-follower-count">
              {follower_count}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Takipçi</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-black text-zinc-50">
              {rating_avg.toFixed(1)}
              <span className="text-xs text-zinc-500 font-mono ml-1">/5</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              {rating_count} oy
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isMine && (
          <div className="flex gap-2 mb-5">
            <Button
              data-testid="profile-follow-btn"
              onClick={handleFollow}
              className={`flex-1 h-11 rounded-full font-display font-bold ${
                is_following
                  ? "bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800"
                  : "bg-gradient-to-r from-rose-500 to-indigo-600 text-white glow-rose hover:opacity-90"
              }`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {is_following ? "Takipte" : "Takip Et"}
            </Button>
            {artist.contact && (
              <Button
                variant="outline"
                className="h-11 rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                onClick={() => window.open(`tel:${artist.contact}`)}
              >
                <Phone className="w-4 h-4 mr-2" />
                İletişim
              </Button>
            )}
          </div>
        )}

        {/* Rating widget */}
        {!isMine && (
          <div className="glass rounded-2xl p-4 mb-5">
            <div className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">
              {my_rating ? "Verdiğin Puan" : "Puan Ver"}
            </div>
            <div className="flex gap-1" data-testid="profile-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  data-testid={`rating-star-${n}`}
                  onClick={() => handleRate(n)}
                  onMouseEnter={() => setHoveredStar(n)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      n <= (hoveredStar || my_rating || 0)
                        ? "fill-rose-400 text-rose-400"
                        : "text-zinc-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-zinc-900 rounded-full p-1 w-fit">
          {["portfolio", "comments"].map((t) => (
            <button
              key={t}
              data-testid={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                tab === t ? "bg-zinc-50 text-zinc-950" : "text-zinc-400"
              }`}
            >
              {t === "portfolio" ? "Portföy" : "Yorumlar"}
            </button>
          ))}
        </div>

        {tab === "portfolio" && (
          <div className="grid grid-cols-3 gap-1">
            {tattoos.map((t) => (
              <motion.div
                key={t.tattoo_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square bg-zinc-900 rounded-md overflow-hidden"
                data-testid={`portfolio-item-${t.tattoo_id}`}
              >
                <img src={t.image} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
            {tattoos.length === 0 && (
              <div className="col-span-3 text-center py-10 text-zinc-500 text-sm">
                Henüz dövme yok.
              </div>
            )}
          </div>
        )}

        {tab === "comments" && (
          <div>
            {user && !isMine && (
              <div className="glass rounded-2xl p-4 mb-4">
                <Textarea
                  data-testid="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorumunu yaz..."
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 mb-2"
                  rows={2}
                />
                <Button
                  data-testid="comment-submit-btn"
                  onClick={handleComment}
                  className="h-9 px-4 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Gönder
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">Henüz yorum yok.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.comment_id} className="glass rounded-2xl p-4" data-testid={`comment-${c.comment_id}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {c.user_picture ? (
                          <img src={c.user_picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-zinc-300 font-bold text-xs">
                            {c.user_name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-100">{c.user_name}</div>
                        <div className="text-[10px] text-zinc-600 font-mono">
                          {new Date(c.created_at).toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
