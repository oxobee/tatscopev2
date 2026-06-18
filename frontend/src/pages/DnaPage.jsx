import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Heart, Bookmark, Users, Palette, Ruler, MapPin, Edit, Calendar, MessageSquare, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SettingsDialog from "@/components/SettingsDialog";
import { Button } from "@/components/ui/button";

const STYLE_LABELS = {
  minimal: "Minimal", blackwork: "Blackwork", traditional: "Geleneksel",
  realism: "Realism", geometric: "Geometrik", fineline: "Fineline", watercolor: "Suluboya",
};

export default function DnaPage() {
  const { user } = useAuth();
  const [dna, setDna] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [visits, setVisits] = useState([]); // recently visited artists (proxy: followed)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dr, rr, fr] = await Promise.all([
          api.get("/dna"),
          api.get("/users/me/reviews"),
          api.get("/follows/me"),
        ]);
        setDna(dr.data);
        setReviews(rr.data);
        setVisits(fr.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28" data-testid="dna-page">
      {/* HERO */}
      <section className="relative px-5 pt-7 pb-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-zinc-950 to-indigo-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.18),transparent_50%)]" />
        </div>

        <div className="flex items-center gap-4 mb-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-indigo-600 overflow-hidden flex items-center justify-center shadow-2xl"
          >
            {user.picture ? (
              <img src={user.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-3xl font-black text-white">
                {user.name?.[0]?.toUpperCase()}
              </span>
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-rose-300/80 mb-1">
              {user.role === "artist" ? "Sanatçı" : "Kullanıcı"}
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-zinc-50 truncate" data-testid="hero-user-name">
              {user.name}
            </h1>
            {user.username && (
              <div className="text-xs text-zinc-400">@{user.username}</div>
            )}
            {user.location && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                <MapPin className="w-3 h-3" /> {user.location}
              </div>
            )}
          </div>
        </div>

        {/* Hero quick actions */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <HeroAction icon={Users} value={visits.length} label="Takip" testid="hero-visits" />
          <HeroAction icon={MessageSquare} value={reviews.length} label="Yorumum" testid="hero-reviews" />
          <SettingsDialog
            trigger={
              <button
                data-testid="hero-settings"
                className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-3 hover:bg-zinc-800/70 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <Edit className="w-4 h-4 text-rose-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-300">
                  Ayarlar
                </span>
              </button>
            }
          />
        </div>

        {user.bio && (
          <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 rounded-2xl p-3 border border-zinc-800/60">
            {user.bio}
          </p>
        )}
      </section>

      <div className="px-5 space-y-6">
        {/* Recent visits/follows */}
        {visits.length > 0 && (
          <section data-testid="recent-visits">
            <h3 className="font-display font-bold text-xs tracking-wider uppercase text-zinc-300 mb-2 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-rose-400" /> Son Ziyaretler
            </h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
              {visits.slice(0, 8).map((a) => (
                <Link
                  key={a.user_id}
                  to={`/app/artist/${a.user_id}`}
                  className="flex-shrink-0 w-20 text-center"
                  data-testid={`visit-${a.user_id}`}
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800 overflow-hidden mb-1 ring-2 ring-rose-500/30">
                    {a.picture ? (
                      <img src={a.picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-bold text-zinc-100">
                        {a.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-300 font-bold truncate">{a.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* My reviews */}
        {reviews.length > 0 && (
          <section data-testid="my-reviews">
            <h3 className="font-display font-bold text-xs tracking-wider uppercase text-zinc-300 mb-2 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-rose-400" /> Yorumlarım
            </h3>
            <div className="space-y-2">
              {reviews.slice(0, 4).map((r) => (
                <Link
                  key={r.review_id}
                  to={`/app/artist/${r.artist_id}`}
                  className="block bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 hover:bg-zinc-900 transition-colors"
                  data-testid={`my-review-${r.review_id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-display font-bold text-zinc-100">
                      {r.artist?.name}
                    </span>
                    {r.stars && (
                      <span className="text-xs font-mono text-rose-400">★ {r.stars}</span>
                    )}
                  </div>
                  {r.text && <p className="text-xs text-zinc-400 line-clamp-2">{r.text}</p>}
                  <div className="text-[10px] font-mono text-zinc-600 mt-1">
                    {new Date(r.created_at).toLocaleDateString("tr-TR")}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* DNA Section header */}
        <section>
          <h2 className="font-display text-xl font-black tracking-tight mb-3">
            <span className="text-zinc-50">Dövme</span>{" "}
            <span className="text-gradient">DNA'm</span>
          </h2>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat icon={Heart} value={dna.totals.likes} label="Beğeni" testid="dna-likes" />
            <Stat icon={Bookmark} value={dna.totals.saves} label="Kayıt" testid="dna-saves" />
            <Stat icon={Users} value={dna.totals.follows} label="Takip" testid="dna-follows" />
          </div>

          {/* Styles */}
          {dna.styles.length > 0 ? (
            <div className="glass rounded-2xl p-4 mb-4" data-testid="dna-styles">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-rose-400" />
                <h3 className="font-display font-bold text-xs tracking-wider uppercase text-zinc-300">
                  Stil Dağılımı
                </h3>
              </div>
              <div className="space-y-2.5">
                {dna.styles.map((s, i) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-sm text-zinc-100 capitalize">
                        {STYLE_LABELS[s.name] || s.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-400">{s.percent}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="h-full bg-gradient-to-r from-rose-500 to-indigo-600"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center mb-4">
              <p className="text-zinc-400 text-sm mb-2">DNA'n henüz oluşmadı.</p>
              <Link to="/app/discover" className="text-rose-400 hover:text-rose-300 font-bold text-xs">
                Dövme beğenmeye başla →
              </Link>
            </div>
          )}

          {/* Colors + Sizes */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-[10px] tracking-wider uppercase text-zinc-400 mb-2">
                Renk
              </h3>
              {Object.entries(dna.colors).length === 0 ? (
                <p className="text-xs text-zinc-600">—</p>
              ) : (
                Object.entries(dna.colors).map(([k, v]) => (
                  <div key={k} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-200">{k === "black" ? "Siyah/Gri" : "Renkli"}</span>
                      <span className="font-mono text-zinc-500">{v}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-[10px] tracking-wider uppercase text-zinc-400 mb-2">
                <Ruler className="w-3 h-3 inline mr-1" /> Boyut
              </h3>
              {Object.entries(dna.sizes).length === 0 ? (
                <p className="text-xs text-zinc-600">—</p>
              ) : (
                Object.entries(dna.sizes).map(([k, v]) => (
                  <div key={k} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-200 capitalize">
                        {k === "small" ? "Küçük" : k === "medium" ? "Orta" : "Büyük"}
                      </span>
                      <span className="font-mono text-zinc-500">{v}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tags */}
          {dna.top_tags.length > 0 && (
            <div className="glass rounded-2xl p-4 mb-4">
              <h3 className="font-display font-bold text-[10px] tracking-wider uppercase text-zinc-400 mb-2">
                Sık Etiketlerin
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {dna.top_tags.map((t) => (
                  <span key={t.tag} className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200">
                    #{t.tag} <span className="text-zinc-500 font-mono ml-0.5">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matches */}
          {dna.matches.length > 0 && (
            <section data-testid="dna-matches" className="mb-4">
              <h3 className="font-display font-bold text-xs tracking-wider uppercase text-zinc-300 mb-2 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-rose-400" /> Sana Uygun
              </h3>
              <div className="space-y-2">
                {dna.matches.slice(0, 5).map((m) => (
                  <Link
                    key={m.artist.user_id}
                    to={`/app/artist/${m.artist.user_id}`}
                    className="flex items-center gap-3 glass rounded-2xl p-3 hover:bg-zinc-800/40 transition-colors"
                    data-testid={`dna-match-${m.artist.user_id}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                      {m.preview_image && (
                        <img src={m.preview_image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm text-zinc-100 truncate">
                        {m.artist.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {m.artist.location || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-base text-rose-400">{m.match_score}%</div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">eşleşme</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}

function HeroAction({ icon: Icon, value, label, testid }) {
  return (
    <div
      className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-3 flex flex-col items-center justify-center gap-1"
      data-testid={testid}
    >
      <Icon className="w-4 h-4 text-rose-400" />
      <div className="font-display text-lg font-black text-zinc-50 leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{label}</div>
    </div>
  );
}

function Stat({ icon: Icon, value, label, testid }) {
  return (
    <div className="glass rounded-2xl p-3 text-center" data-testid={testid}>
      <Icon className="w-3.5 h-3.5 text-rose-400 mx-auto mb-1" />
      <div className="font-display text-xl font-black text-zinc-50 leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{label}</div>
    </div>
  );
}
