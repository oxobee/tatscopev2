import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // After loading, if user is logged in, send them to /app/discover
    if (!loading && user) {
      const t = setTimeout(() => navigate("/app/discover"), 1400);
      return () => clearTimeout(t);
    }
  }, [user, loading, navigate]);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-zinc-950"
      data-testid="splash-screen"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1753259789341-808371092e19?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80"
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto pt-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-8">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-zinc-300">
              Dövme · Eşleşme · Sanat
            </span>
          </div>
          <h1 className="font-display text-6xl sm:text-7xl font-black tracking-tight">
            <span className="text-gradient">Tattoo</span>
            <span className="text-zinc-50">Match</span>
          </h1>
          <p className="mt-6 text-zinc-400 text-base leading-relaxed max-w-sm mx-auto">
            Dövme sanatçısı bulmanın yeni yolu. Kaydır, beğen, kaydet — kendi
            stilini keşfet.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="relative z-10 w-full max-w-md mx-auto pb-12 px-6 space-y-3"
      >
        <Button
          data-testid="splash-start-btn"
          onClick={() => navigate(user ? "/app/discover" : "/onboarding")}
          className="w-full h-14 rounded-full font-display text-base font-bold bg-gradient-to-br from-rose-500 to-indigo-600 hover:opacity-90 glow-rose"
        >
          <Compass className="w-5 h-5 mr-2" />
          {user ? "Keşfet" : "Başla"}
        </Button>
        {!user && (
          <Button
            data-testid="splash-login-btn"
            onClick={() => navigate("/login")}
            variant="ghost"
            className="w-full h-12 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          >
            Hesabım var · Giriş Yap
          </Button>
        )}
        <p className="text-center text-xs text-zinc-600 font-mono pt-4">
          v1.0 · İstanbul
        </p>
      </motion.div>
    </div>
  );
}
