import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Splash from "@/pages/Splash";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthCallback from "@/pages/AuthCallback";
import AppShell from "@/components/AppShell";
import Discover from "@/pages/Discover";
import Moodboard from "@/pages/Moodboard";
import DnaPage from "@/pages/DnaPage";
import ArtistProfile from "@/pages/ArtistProfile";
import Dashboard from "@/pages/Dashboard";
import FollowingFeed from "@/pages/FollowingFeed";
import Messages from "@/pages/Messages";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 font-mono text-sm">Yükleniyor...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RootRouter() {
  const location = useLocation();
  if (location.hash && location.hash.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<AuthCallback />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/app/discover" replace />} />
        <Route path="discover" element={<Discover />} />
        <Route path="following-feed" element={<FollowingFeed />} />
        <Route path="moodboard" element={<Moodboard />} />
        <Route path="dna" element={<DnaPage />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:userId" element={<Messages />} />
        <Route path="artist/:id" element={<ArtistProfile />} />
        <Route path="studio" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <AuthProvider>
          <RootRouter />
          <Toaster theme="dark" position="top-center" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
