import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass, Bookmark, Brain, User, LogOut, Palette, Users, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import RightPanel from "@/components/RightPanel";

const NAV_USER = [
  { to: "/app/discover", icon: Compass, label: "Keşfet", testid: "nav-discover" },
  { to: "/app/moodboard", icon: Bookmark, label: "Panom", testid: "nav-moodboard" },
  { to: "/app/dna", icon: Brain, label: "Dövme DNA'm", testid: "nav-dna" },
  { to: "/app/following", icon: Users, label: "Takip", testid: "nav-following" },
  { to: "/app/me", icon: User, label: "Profil", testid: "nav-profile" },
];

const NAV_ARTIST = [
  { to: "/app/discover", icon: Compass, label: "Keşfet", testid: "nav-discover" },
  { to: "/app/studio", icon: Palette, label: "Stüdyom", testid: "nav-studio" },
  { to: "/app/moodboard", icon: Bookmark, label: "Panom", testid: "nav-moodboard" },
  { to: "/app/dna", icon: Brain, label: "Dövme DNA'm", testid: "nav-dna" },
  { to: "/app/me", icon: User, label: "Profil", testid: "nav-profile" },
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
    <div className="min-h-screen bg-zinc-950 relative" data-testid="app-shell">
      {/* DESKTOP: 3-column layout */}
      <div className="hidden md:grid md:grid-cols-[256px_minmax(0,1fr)_320px] md:gap-0 h-screen">
        {/* Left sidebar */}
        <aside className="border-r border-zinc-900 p-6 flex flex-col">
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
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center font-display font-black text-white text-sm overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-zinc-100 text-sm truncate" data-testid="sidebar-user-name">{user?.name}</div>
                <div className="text-xs text-zinc-500 capitalize">
                  {user?.role === "artist" ? "Sanatçı" : "Kullanıcı"}
                </div>
              </div>
              <Button
                data-testid="logout-btn"
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                className="text-zinc-500 hover:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Center feed */}
        <main className="overflow-hidden flex justify-center bg-zinc-950">
          <div className="w-full max-w-[480px] h-screen overflow-hidden">
            <Outlet />
          </div>
        </main>

        {/* Right panel */}
        <aside className="border-l border-zinc-900 overflow-y-auto p-6">
          <RightPanel />
        </aside>
      </div>

      {/* MOBILE layout */}
      <div className="md:hidden flex flex-col h-screen">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        {/* Bottom nav */}
        <nav
          data-testid="bottom-nav"
          className="glass border-t border-white/5 px-2 py-2 flex items-center justify-around z-30"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={`mobile-${item.testid}`}
                className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl min-w-[56px]"
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-rose-400" : "text-zinc-500"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold tracking-wide ${
                    active ? "text-zinc-100" : "text-zinc-600"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
