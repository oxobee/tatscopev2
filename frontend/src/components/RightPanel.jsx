import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, Crown } from "lucide-react";
import { api } from "@/lib/api";

export default function RightPanel() {
  const [dna, setDna] = useState(null);
  const [stats, setStats] = useState({ artists: 0, tattoos: 0 });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/dna");
        setDna(data);
      } catch {}
      try {
        const { data } = await api.get("/artists");
        const totalT = data.reduce((s, a) => s + (a.tattoo_count || 0), 0);
        setStats({ artists: data.length, tattoos: totalT });
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-6" data-testid="right-panel">
      {/* Stats */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-rose-400" />
          <h3 className="font-display font-bold text-sm tracking-wide uppercase text-zinc-300">
            Platform
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-display text-3xl font-black text-zinc-50">
              {stats.artists}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Sanatçı</div>
          </div>
          <div>
            <div className="font-display text-3xl font-black text-zinc-50">
              {stats.tattoos}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Dövme</div>
          </div>
        </div>
      </div>

      {/* DNA mini preview */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <h3 className="font-display font-bold text-sm tracking-wide uppercase text-zinc-300">
            Dövme DNA'm
          </h3>
        </div>
        {dna && dna.styles.length > 0 ? (
          <div className="space-y-3">
            {dna.styles.slice(0, 3).map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-zinc-200 capitalize">
                    {s.name}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{s.percent}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-indigo-600"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            ))}
            <Link
              to="/app/dna"
              className="block text-center mt-4 text-xs text-rose-400 hover:text-rose-300 font-bold tracking-wide uppercase"
            >
              Tüm DNA'mı gör →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 leading-relaxed">
            Dövmeleri beğen, DNA'n şekillensin.
          </p>
        )}
      </div>

      {/* Best matches */}
      {dna && dna.matches && dna.matches.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-rose-400" />
            <h3 className="font-display font-bold text-sm tracking-wide uppercase text-zinc-300">
              Sana Uygun
            </h3>
          </div>
          <div className="space-y-3">
            {dna.matches.slice(0, 3).map((m) => (
              <Link
                key={m.artist.user_id}
                to={`/app/artist/${m.artist.user_id}`}
                className="flex items-center gap-3 hover:bg-zinc-800/40 rounded-xl p-2 -mx-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                  {m.preview_image && (
                    <img src={m.preview_image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-100 truncate">{m.artist.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{m.artist.location || "—"}</div>
                </div>
                <div className="text-xs font-mono font-bold text-rose-400">{m.match_score}%</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
