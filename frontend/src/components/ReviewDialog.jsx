import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Image, Send, Loader2, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function ReviewDialog({ open, onClose, artistId, artistName, onCreated }) {
  const fileRef = useRef(null);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) {
      toast.error("Foto 3MB'tan büyük olamaz");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!stars && !text.trim() && !photo) {
      toast.error("En az bir alan doldurmalısın");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {};
      if (stars) payload.stars = stars;
      if (text.trim()) payload.text = text.trim();
      if (photo) payload.photo = photo;
      const { data } = await api.post(`/artists/${artistId}/reviews`, payload);
      toast.success("Değerlendirmen yayınlandı");
      onCreated?.(data);
      // reset
      setStars(0);
      setText("");
      setPhoto("");
      onClose();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md" data-testid="review-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            <span className="text-zinc-400 font-normal">Değerlendir:</span>{" "}
            <span className="text-gradient">{artistName}</span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Puan, yorum, foto — istediğin alanı doldur. En az biri zorunlu.
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              data-testid={`review-star-${n}`}
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setStars(stars === n ? 0 : n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
            >
              <Star
                className={`w-9 h-9 transition-colors ${
                  n <= (hover || stars) ? "fill-rose-400 text-rose-400" : "text-zinc-700"
                }`}
              />
            </motion.button>
          ))}
        </div>

        {/* Photo */}
        <div
          className="aspect-video bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-rose-500/40 relative"
          onClick={() => fileRef.current?.click()}
        >
          {photo ? (
            <>
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPhoto("");
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-zinc-100" />
              </button>
            </>
          ) : (
            <div className="text-center">
              <Image className="w-7 h-7 text-zinc-600 mx-auto mb-1.5" />
              <p className="text-xs text-zinc-500">Dövmeni paylaş (opsiyonel)</p>
            </div>
          )}
          <input
            ref={fileRef}
            data-testid="review-photo-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        <Textarea
          data-testid="review-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Deneyimini anlat... (opsiyonel)"
          rows={3}
          className="bg-zinc-900 border-zinc-800 text-zinc-100"
        />

        <Button
          data-testid="review-submit-btn"
          onClick={submit}
          disabled={submitting}
          className="w-full h-11 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-display font-bold"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Yayınla</>}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
