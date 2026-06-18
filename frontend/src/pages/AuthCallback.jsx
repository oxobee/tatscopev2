import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");

    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        setUser(data);
        // Clean the hash
        window.history.replaceState(null, "", window.location.pathname);
        navigate(data.role === "artist" ? "/app/studio" : "/app/discover", { replace: true });
      } catch (e) {
        console.error("Auth callback failed", e);
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
        <p className="text-zinc-500 font-mono text-sm">Oturum açılıyor...</p>
      </div>
    </div>
  );
}
