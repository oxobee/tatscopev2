import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Instagram, Phone, Star, UserPlus, ArrowLeft, ShieldCheck, MessageCircle, Plus, BadgeCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import ReviewDialog from "@/components/ReviewDialog";
import FullscreenViewer from "@/components/FullscreenViewer";

export default function ArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("portfolio");
  const [reviews, setReviews] = useState([]);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [tattooViewer, setTattooViewer] = useState(null);
  const [reviewViewer, setReviewViewer] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/artists/${id}`);
      setData(data);
      const r = await api.get(`/artists/${id}/reviews`);
      setReviews(r.data);
    } catch {
      toast.error("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

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
    if (!data.is_verified_client) {
      toast.error("Puan vermek için sanatçı seni doğrulamalı");
      return;
    }
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  const { artist, tattoos, follower_count, rating_avg, rating_count, is_following, my_rating, is_verified_client } = data;
  const isMine = user?.user_id === artist.user_id;

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28" data-testid="artist-profile-page">
      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-rose-500/30 via-zinc-900 to-indigo-600/30">
        {tattoos[0]?.image && (
          <img src={tattoos[0].image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-zinc-950" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center z-10"
          data-testid="profile-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-100" />
        </button>
      </div>

      <div className="px-5 -mt-12 relative z-10">
        {/* Avatar + name */}
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
            <h1
              className="font-display text-2xl font-black tracking-tight text-zinc-50 truncate"
              data-testid="profile-artist-name"
            >
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
              <MapPin className="w-3.5 h-3.5" /> <span>{artist.location}</span>
            </div>
          )}
          {artist.instagram && (
            <a
              href={`https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-rose-400"
            >
              <Instagram className="w-3.5 h-3.5" /> <span>{artist.instagram}</span>
            </a>
          )}
          {artist.contact && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> <span>{artist.contact}</span>
            </div>
          )}
        </div>

        {artist.bio && <p className="text-sm text-zinc-300 leading-relaxed mb-4">{artist.bio}</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Stat label="Eser" value={tattoos.length} />
          <Stat label="Takipçi" value={follower_count} testid="profile-follower-count" />
          <Stat label={`${rating_count} oy`} value={`${rating_avg.toFixed(1)}/5`} />
        </div>

        {/* Actions */}
        {!isMine && (
          <div className="flex gap-2 mb-3">
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
            <Button
              data-testid="profile-message-btn"
              variant="outline"
              onClick={() => navigate(`/app/messages/${artist.user_id}`)}
              className="h-11 px-4 rounded-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Mesaj
            </Button>
          </div>
        )}

        {/* Verification banner */}
        {!isMine && (
          <div
            className={`mb-3 p-3 rounded-2xl flex items-center gap-3 text-xs ${
              is_verified_client
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-zinc-900/60 border border-zinc-800"
            }`}
            data-testid="verification-banner"
          >
            <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${is_verified_client ? "text-emerald-400" : "text-zinc-500"}`} />
            <span className={is_verified_client ? "text-emerald-200" : "text-zinc-400"}>
              {is_verified_client
                ? "Doğrulanmış müşterisin — yorum ve puan verebilirsin"
                : "Yorum & puan için sanatçı seni doğrulamalı (dövme yaptıran kullanıcılar)"}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-zinc-900 rounded-full p-1 w-fit">
          {[
            { v: "portfolio", l: "Portföy" },
            { v: "reviews", l: "Değerlendirmeler" },
          ].map((t) => (
            <button
              key={t.v}
              data-testid={`tab-${t.v}`}
              onClick={() => setTab(t.v)}
              className={`px-5 py-2 rounded-full text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                tab === t.v ? "bg-zinc-50 text-zinc-950" : "text-zinc-400"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {tab === "portfolio" && (
          <div className="grid grid-cols-3 gap-1">
            {tattoos.map((t) => (
              <motion.button
                key={t.tattoo_id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setTattooViewer(t)}
                className="relative bg-zinc-900 rounded-xl overflow-hidden"
                style={{ aspectRatio: "9 / 16" }}
                data-testid={`portfolio-item-${t.tattoo_id}`}
              >
                <img src={t.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </motion.button>
            ))}
            {tattoos.length === 0 && (
              <div className="col-span-3 text-center py-10 text-zinc-500 text-sm">Henüz dövme yok.</div>
            )}
          </div>
        )}

        {tab === "reviews" && (
          <div>
            {/* Existing rating widget */}
            {!isMine && is_verified_client && (
              <div className="glass rounded-2xl p-4 mb-3" data-testid="rating-widget">
                <div className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">
                  {my_rating ? "Verdiğin Puan" : "Hızlı Puan"}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      data-testid={`rating-star-${n}`}
                      onClick={() => handleRate(n)}
                      onMouseEnter={() => setHoveredStar(n)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-1"
                    >
                      <Star className={`w-7 h-7 transition-colors ${
                        n <= (hoveredStar || my_rating || 0) ? "fill-rose-400 text-rose-400" : "text-zinc-700"
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add review button (only if verified) */}
            {!isMine && is_verified_client && (
              <Button
                data-testid="add-review-btn"
                onClick={() => setReviewOpen(true)}
                className="w-full mb-4 h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Değerlendirme Ekle
              </Button>
            )}

            {/* Review cards */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  Henüz değerlendirme yok.
                </div>
              ) : (
                reviews.map((r) => <ReviewCard key={r.review_id} review={r} onOpenPhoto={setReviewViewer} />)
              )}
            </div>
          </div>
        )}
      </div>

      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        artistId={id}
        artistName={artist.name}
        onCreated={(r) => setReviews((prev) => [r, ...prev])}
      />

      {/* Fullscreen tattoo popup */}
      <FullscreenViewer src={tattooViewer?.image} onClose={() => setTattooViewer(null)} />
      {/* Fullscreen review photo popup */}
      <FullscreenViewer src={reviewViewer?.photo} onClose={() => setReviewViewer(null)} />
    </div>
  );
}

function ReviewCard({ review, onOpenPhoto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden"
      data-testid={`review-${review.review_id}`}
    >
      {review.photo && (
        <button
          onClick={() => onOpenPhoto(review)}
          className="w-full block"
          data-testid={`review-photo-${review.review_id}`}
        >
          <img src={review.photo} alt="" className="w-full max-h-64 object-cover" />
        </button>
      )}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
            {review.user_picture ? (
              <img src={review.user_picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-300 font-bold text-sm">
                {review.user_name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-display font-bold text-zinc-100 truncate">
                {review.user_name}
              </span>
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" title="Doğrulanmış müşteri" />
            </div>
            <div className="text-[10px] text-zinc-600 font-mono">
              {new Date(review.created_at).toLocaleDateString("tr-TR")}
            </div>
          </div>
          {review.stars && (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-3.5 h-3.5 ${
                    n <= review.stars ? "fill-rose-400 text-rose-400" : "text-zinc-700"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        {review.text && <p className="text-sm text-zinc-300 leading-relaxed">{review.text}</p>}
      </div>
    </motion.div>
  );
}

function Stat({ value, label, testid }) {
  return (
    <div className="text-center" data-testid={testid}>
      <div className="font-display text-xl font-black text-zinc-50">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mt-0.5">{label}</div>
    </div>
  );
}
