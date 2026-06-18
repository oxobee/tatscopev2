import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, MapPin, Star } from "lucide-react";
import { api } from "@/lib/api";

export default function Following() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/follows/me");
        setArtists(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-5 pb-24" data-testid="following-page">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-rose-400" />
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-zinc-500">
            Takip
          </span>
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight text-zinc-50">
          Takip Ettiklerin
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm mb-3">Henüz kimseyi takip etmiyorsun.</p>
          <Link to="/app/discover" className="text-rose-400 hover:text-rose-300 font-bold text-sm">
            Sanatçı keşfet →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {artists.map((a) => (
            <Link
              key={a.user_id}
              to={`/app/artist/${a.user_id}`}
              className="flex items-center gap-3 glass rounded-2xl p-4 hover:bg-zinc-800/40 transition-colors"
              data-testid={`following-${a.user_id}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 overflow-hidden flex items-center justify-center">
                {a.picture ? (
                  <img src={a.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-zinc-100">
                    {a.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-zinc-100 truncate">{a.name}</div>
                <div className="text-xs text-zinc-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {a.location || a.studio_name || "—"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
