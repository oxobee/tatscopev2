import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Hand, Heart, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Hand,
    title: "Dikey Kaydır",
    text: "Aşağı veya yukarı kaydırarak farklı sanatçıları keşfet. Her kart bir dövme sanatçısı.",
    accent: "from-rose-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Çift Dokun",
    text: "Beğendiğin bir tasarımı çift dokunarak Panom'a (moodboard) kaydet.",
    accent: "from-rose-500 to-indigo-600",
  },
  {
    icon: UserPlus,
    title: "Takip Et",
    text: "Stilini sevdiğin sanatçıları takip et. Yeni eserleri akışında belirsin.",
    accent: "from-indigo-500 to-purple-600",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const last = step === STEPS.length - 1;
  const Icon = STEPS[step].icon;

  return (
    <div
      className="min-h-screen bg-zinc-950 flex flex-col"
      data-testid="onboarding-screen"
    >
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-12">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-gradient-to-r from-rose-500 to-indigo-600" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <div
                className={`w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${STEPS[step].accent} flex items-center justify-center shadow-2xl`}
              >
                <Icon className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-display text-4xl font-black tracking-tight text-zinc-50">
                {STEPS[step].title}
              </h2>
              <p className="mt-4 text-zinc-400 text-base leading-relaxed max-w-sm mx-auto">
                {STEPS[step].text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 pb-10 max-w-md mx-auto w-full space-y-3">
        <Button
          data-testid="onboarding-next-btn"
          onClick={() => (last ? navigate("/register") : setStep(step + 1))}
          className="w-full h-14 rounded-full font-display text-base font-bold bg-gradient-to-br from-rose-500 to-indigo-600 hover:opacity-90 glow-rose"
        >
          {last ? "Hesap Oluştur" : "İleri"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
        <Button
          data-testid="onboarding-skip-btn"
          onClick={() => navigate("/login")}
          variant="ghost"
          className="w-full h-12 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
        >
          Geç · Giriş Yap
        </Button>
      </div>
    </div>
  );
}
