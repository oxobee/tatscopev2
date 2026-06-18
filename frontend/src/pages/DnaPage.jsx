import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Heart, Bookmark, Users, Palette, Ruler } from "lucide-react";
import { api } from "@/lib/api";

const STYLE_LABELS = {
  minimal: "Minimal",
  blackwork: "Blackwork",
  traditional: "Geleneksel",
  realism: "Realism",
  geometric: "Geometrik",
  fineline: "Fineline",
  watercolor: "Suluboya",
};

export default function DnaPage() {
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/dna");
        setDna(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-5 pb-24" data-testid="dna-page">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-rose-400" />
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-zinc-500">
            AI Insights
          </span>
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight">
          <span className="text-zinc-50">Dövme</span>{" "}
          <span className="text-gradient">DNA'm</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Beğeni ve kaydettiğin dövmelere göre çıkarılan kişisel stilin.
        </p>
      </header>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={Heart} value={dna.totals.likes} label="Beğeni" testid="dna-likes" />
        <Stat icon={Bookmark} value={dna.totals.saves} label="Kayıt" testid="dna-saves" />
        <Stat icon={Users} value={dna.totals.follows} label="Takip" testid="dna-follows" />
      </div>

      {/* Styles */}
      {dna.styles.length > 0 ? (
        <section className="glass rounded-2xl p-5 mb-6" data-testid="dna-styles">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-rose-400" />
            <h3 className="font-display font-bold text-sm tracking-wide uppercase text-zinc-300">
              Stil Dağılımı
            </h3>
          </div>
          <div className="space-y-3">
            {dna.styles.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-display font-bold text-zinc-100 capitalize">
                    {STYLE_LABELS[s.name] || s.name}
                  </span>
                  <span className="text-sm font-mono font-bold text-rose-400">{s.percent}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
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
        </section>
      ) : (
        <section className="glass rounded-2xl p-8 text-center mb-6">
          <p className="text-zinc-400 mb-3">DNA'n henüz oluşmadı.</p>
          <Link to="/app/discover" className="text-rose-400 hover:text-rose-300 font-bold text-sm">
            Dövme beğenmeye başla →
          </Link>
        </section>
      )}

      {/* Colors + Sizes */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <section className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-xs tracking-wide uppercase text-zinc-300 mb-3">
            Renk Tercihi
          </h3>
          {Object.entries(dna.colors).length === 0 ? (
            <p className="text-xs text-zinc-600">—</p>
          ) : (
            Object.entries(dna.colors).map(([k, v]) => (
              <div key={k} className="mb-2 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-200 capitalize">{k === "black" ? "Siyah/Gri" : "Renkli"}</span>
                  <span className="font-mono text-zinc-500">{v}%</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))
          )}
        </section>

        <section className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-xs tracking-wide uppercase text-zinc-300 mb-3">
            <Ruler className="w-3 h-3 inline mr-1" /> Boyut
          </h3>
          {Object.entries(dna.sizes).length === 0 ? (
            <p className="text-xs text-zinc-600">—</p>
          ) : (
            Object.entries(dna.sizes).map(([k, v]) => (
              <div key={k} className="mb-2 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
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
        </section>
      </div>

      {/* Tags */}
      {dna.top_tags.length > 0 && (
        <section className="glass rounded-2xl p-5 mb-6">
          <h3 className="font-display font-bold text-xs tracking-wide uppercase text-zinc-300 mb-3">
            Sık Etiketlerin
          </h3>
          <div className="flex flex-wrap gap-2">
            {dna.top_tags.map((t) => (
              <span
                key={t.tag}
                className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-200"
              >
                #{t.tag} <span className="text-zinc-500 font-mono ml-1">{t.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Matches */}
      {dna.matches.length > 0 && (
        <section className="mb-6" data-testid="dna-matches">
          <h3 className="font-display font-bold text-sm tracking-wide uppercase text-zinc-300 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-rose-400" /> Sana Uygun Sanatçılar
          </h3>
          <div className="space-y-2">
            {dna.matches.map((m) => (
              <Link
                key={m.artist.user_id}
                to={`/app/artist/${m.artist.user_id}`}
                className="flex items-center gap-3 glass rounded-2xl p-3 hover:bg-zinc-800/40 transition-colors"
                data-testid={`dna-match-${m.artist.user_id}`}
              >
                <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                  {m.preview_image && (
                    <img src={m.preview_image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-zinc-100 truncate">
                    {m.artist.name}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {m.artist.location || m.artist.studio_name || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-lg text-rose-400">{m.match_score}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600">eşleşme</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label, testid }) {
  return (
    <div className="glass rounded-2xl p-4 text-center" data-testid={testid}>
      <Icon className="w-4 h-4 text-rose-400 mx-auto mb-2" />
      <div className="font-display text-2xl font-black text-zinc-50">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mt-1">
        {label}
      </div>
    </div>
  );
}
