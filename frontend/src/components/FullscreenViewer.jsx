import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function FullscreenViewer({ src, onClose, footer }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
          data-testid="fullscreen-viewer"
        >
          <button
            onClick={onClose}
            data-testid="fullscreen-viewer-close"
            className="absolute top-5 right-5 w-11 h-11 rounded-full glass border border-white/10 flex items-center justify-center hover:scale-105 transition-transform z-10"
          >
            <X className="w-5 h-5 text-zinc-100" />
          </button>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[95vw] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900"
          >
            <img src={src} alt="" className="max-w-[95vw] max-h-[80vh] block" />
            {footer && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
