import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Search, Globe, LocateFixed, Check } from "lucide-react";
import { api } from "@/lib/api";

export default function FilterPopup({ open, onClose, value, onChange }) {
  const [locs, setLocs] = useState({ with_artists: [], all_provinces: [] });
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await api.get("/locations");
        setLocs(data);
      } catch {}
    })();
  }, [open]);

  const select = (v, label) => {
    onChange({ value: v, label });
    onClose();
  };

  const safeProvinces = Array.isArray(locs.all_provinces) ? locs.all_provinces : [];
  const filtered = safeProvinces.filter((p) =>
    String(p).toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-4"
          data-testid="filter-popup-backdrop"
        >
          <motion.div
            initial={{ y: 60, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            data-testid="filter-popup"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800"
              data-testid="filter-popup-close"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>

            <h3 className="font-display text-2xl font-black tracking-tight mb-1 text-zinc-50">
              Konum Filtrele
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Yakınındaki sanatçıları gör veya il/ilçe yaz.
            </p>

            <div className="space-y-2 mb-4">
              <Quick
                icon={Globe}
                label="Tümünü Göster"
                active={value === "all" || !value}
                onClick={() => select("all", "Tümü")}
                testid="filter-all"
              />
              <Quick
                icon={LocateFixed}
                label="Yakınımdakiler"
                hint="Profilindeki konuma göre"
                active={value === "nearby"}
                onClick={() => select("nearby", "Yakınımdakiler")}
                testid="filter-nearby"
              />
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                data-testid="filter-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="İl ara..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none focus:border-rose-500/40"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 -mr-2 pr-2">
              {locs.with_artists.length > 0 && !q && (
                <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-600 mt-2 mb-1">
                  Sanatçısı olan iller
                </div>
              )}
              {!q &&
                (Array.isArray(locs.with_artists) ? locs.with_artists : []).map((l) => (
                  <button
                    key={`a-${l.name}`}
                    data-testid={`filter-city-${l.name}`}
                    onClick={() => select(l.name, l.name)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 text-sm text-zinc-100 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {l.name}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">{l.count} sanatçı</span>
                  </button>
                ))}
              {q && (
                <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-600 mt-2 mb-1">
                  Tüm iller
                </div>
              )}
              {(q ? filtered : locs.all_provinces).slice(0, 30).map((p) => {
                const active = value === p;
                return (
                  <button
                    key={p}
                    data-testid={`filter-province-${p}`}
                    onClick={() => select(p, p)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left ${
                      active ? "bg-rose-500/15 border border-rose-500/30" : "hover:bg-zinc-900"
                    }`}
                  >
                    <span className="text-sm text-zinc-200">{p}</span>
                    {active && <Check className="w-4 h-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Quick({ icon: Icon, label, hint, active, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
        active
          ? "bg-gradient-to-r from-rose-500/15 to-indigo-600/15 border-rose-500/30"
          : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          active ? "bg-gradient-to-br from-rose-500 to-indigo-600" : "bg-zinc-900"
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-zinc-300"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-sm text-zinc-100">{label}</div>
        {hint && <div className="text-[11px] text-zinc-500">{hint}</div>}
      </div>
      {active && <Check className="w-4 h-4 text-rose-400" />}
    </button>
  );
}
