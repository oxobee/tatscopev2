import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * ProfilePicturePicker — drag/click to upload, converts to base64 data URL.
 * - Compresses by drawing to canvas (max 512px, 0.85 quality)
 * - Calls onChange(dataUrl) when ready
 */
export default function ProfilePicturePicker({ value, onChange, size = "lg" }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const dimension = size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const iconSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";

  const compress = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxSide = 512;
          let { width, height } = img;
          if (width > height && width > maxSide) {
            height = (height * maxSide) / width;
            width = maxSide;
          } else if (height > maxSide) {
            width = (width * maxSide) / height;
            height = maxSide;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel seç");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Maksimum 6MB");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compress(file);
      onChange(dataUrl);
    } catch {
      toast.error("Görsel okunamadı");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        data-testid="profile-pic-trigger"
        className={`relative ${dimension} rounded-2xl bg-zinc-900 border-2 border-zinc-800 overflow-hidden flex items-center justify-center hover:border-rose-500/40 transition-colors group`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera className={`${iconSize} text-zinc-500 group-hover:text-rose-400`} />
        )}
        {busy && (
          <div className="absolute inset-0 bg-zinc-950/70 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
          </div>
        )}
      </button>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          data-testid="profile-pic-upload-btn"
          className="text-xs font-display font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
        >
          <Upload className="w-3 h-3" />
          {value ? "Değiştir" : "Fotoğraf Yükle"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            data-testid="profile-pic-remove-btn"
            className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1"
          >
            <X className="w-2.5 h-2.5" /> Kaldır
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        data-testid="profile-pic-input"
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
