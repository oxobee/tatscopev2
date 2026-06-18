import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass, Bookmark, Brain, Palette, Heart, MessageSquare, LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import RightPanel from "@/components/RightPanel";

const NAV_USER = [
  { to: "/app/discover", icon: Compass, label: "Keşfet", testid: "nav-discover" },
  { to: "/app/following-feed", icon: Heart, label: "Takip", testid: "nav-following" },
  { to: "/app/moodboard", icon: Bookmark, label: "Panom", testid: "nav-moodboard" },
  { to: "/app/messages", icon: MessageSquare, label: "Mesaj", testid: "nav-messages" },
  { to: "/app/dna", icon: Brain, label: "Dövme DNA'm", testid: "nav-dna" },
];

const NAV_ARTIST = [
  { to: "/app/discover", icon: Compass, label: "Keşfet", testid: "nav-discover" },
  { to: "/app/studio", icon: Palette, label: "Stüdyom", testid: "nav-studio" },
  { to: "/app/moodboard", icon: Bookmark, label: "Panom", testid: "nav-moodboard" },
  { to: "/app/messages", icon: MessageSquare, label: "Mesaj", testid: "nav-messages" },
  { to: "/app/dna", icon: Brain, label: "Dövme DNA'm", testid: "nav-dna" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const NAV = user?.role === "artist" ? NAV_ARTIST : NAV_USER;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="h-screen bg-zinc-950 relative flex flex-col md:grid md:grid-cols-[256px_minmax(0,1fr)_320px]"
      data-testid="app-shell"
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex border-r border-zinc-900 p-6 flex-col h-screen">
        <Link to="/app/discover" className="font-display text-3xl font-black tracking-tight mb-10">
          <span className="text-gradient">Tattoo</span>
          <span className="text-zinc-50">Match</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={item.testid}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? "bg-gradient-to-r from-rose-500/15 to-indigo-600/15 text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-rose-400" : ""}`} />
                <span className="font-display font-bold text-[15px]">{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-900">
          <Link to="/app/dna" className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/60 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center font-display font-black text-white text-sm overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-zinc-100 text-sm truncate" data-testid="sidebar-user-name">
                {user?.name}
              </div>
              <div className="text-xs text-zinc-500 capitalize">
                {user?.role === "artist" ? "Sanatçı" : "Kullanıcı"}
              </div>
            </div>
            <Button
              data-testid="logout-btn"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              className="text-zinc-500 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </aside>

      {/* Center main */}
      <main className="flex-1 overflow-hidden flex justify-center bg-zinc-950 min-h-0 relative">
        <div className="w-full md:max-w-[480px] h-full overflow-hidden">
          <Outlet />
        </div>
      </main>

      {/* Desktop right panel */}
      <aside className="hidden md:block border-l border-zinc-900 overflow-y-auto p-6 h-screen">
        <RightPanel />
      </aside>

      {/* Mobile floating popup nav */}
      <motion.nav
        data-testid="bottom-nav"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="md:hidden fixed bottom-4 left-4 right-4 z-40 glass border border-white/10 rounded-full px-2 py-2 flex items-center justify-around shadow-2xl"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              data-testid={`mobile-${item.testid}`}
              className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full min-w-[52px]"
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500/30 to-indigo-600/30 border border-white/10"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <Icon
                className={`relative w-5 h-5 transition-colors ${
                  active ? "text-rose-300" : "text-zinc-400"
                }`}
              />
              <span
                className={`relative text-[9px] font-bold tracking-wide ${
                  active ? "text-zinc-50" : "text-zinc-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
