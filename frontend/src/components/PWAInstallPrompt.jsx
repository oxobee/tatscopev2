import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "tatscope_pwa_dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        // Slight delay to feel less intrusive
        setTimeout(() => setOpen(true), 2200);
      }
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
      localStorage.setItem(DISMISS_KEY, "installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS: show manual instructions popup if not dismissed
    if (ios && !dismissed) {
      setTimeout(() => setOpen(true), 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === "accepted") {
      setOpen(false);
      setInstalled(true);
      localStorage.setItem(DISMISS_KEY, "accepted");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, "dismissed");
  };

  if (installed) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[80]"
          data-testid="pwa-install-prompt"
        >
          <div className="relative glass border border-rose-500/30 rounded-3xl p-5 shadow-2xl overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              data-testid="pwa-dismiss-btn"
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-900/80 flex items-center justify-center hover:bg-zinc-800 z-10"
            >
              <X className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <div className="relative flex items-center gap-3 mb-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
                className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0"
              >
                <img src="/icon.png" alt="TatScope" className="w-9 h-9 object-contain" />
              </motion.div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold text-rose-300 mb-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Yeni</span>
                </div>
                <h3 className="font-display text-base font-black tracking-tight text-zinc-50 leading-tight">
                  TatScope'u uygulamana ekle
                </h3>
              </div>
            </div>

            <p className="relative text-xs text-zinc-300 leading-relaxed mb-4">
              {isIOS
                ? "Safari'de paylaş simgesine → 'Ana Ekrana Ekle' deyince TatScope tıpkı bir uygulama gibi çalışır. Tam ekran, hızlı, kesintisiz."
                : "Tek tıkla telefonuna kur, tarayıcıyla uğraşma. Tam ekran, hızlı ve her zaman parmaklarının ucunda."}
            </p>

            <div className="relative flex gap-2">
              {!isIOS && deferredPrompt && (
                <Button
                  data-testid="pwa-install-btn"
                  onClick={handleInstall}
                  className="flex-1 h-10 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold text-xs glow-rose"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Hemen Yükle
                </Button>
              )}
              <Button
                data-testid="pwa-later-btn"
                onClick={handleDismiss}
                variant="ghost"
                className={`${
                  isIOS || !deferredPrompt ? "flex-1" : ""
                } h-10 rounded-full text-zinc-400 hover:text-zinc-100 text-xs font-display font-bold`}
              >
                {isIOS ? "Anladım" : "Sonra"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
