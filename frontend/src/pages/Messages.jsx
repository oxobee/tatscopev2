import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function ConversationList({ list, activeId, onSelect }) {
  return (
    <div className="space-y-1 p-3" data-testid="conversations-list">
      {list.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Henüz mesaj yok</p>
          <p className="text-xs text-zinc-600 mt-1">Sanatçı profilinden mesaj başlat</p>
        </div>
      ) : (
        list.map((c) => (
          <button
            key={c.other_user.user_id}
            data-testid={`conv-${c.other_user.user_id}`}
            onClick={() => onSelect(c.other_user.user_id)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
              activeId === c.other_user.user_id
                ? "bg-gradient-to-r from-rose-500/15 to-indigo-600/15 border border-rose-500/30"
                : "hover:bg-zinc-900"
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0">
              {c.other_user.picture ? (
                <img src={c.other_user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-zinc-100">
                  {c.other_user.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm text-zinc-100 truncate">
                {c.other_user.name}
              </div>
              <div className="text-xs text-zinc-500 truncate">{c.last_message?.content}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function ChatThread({ otherUserId, onBack }) {
  const { user } = useAuth();
  const [thread, setThread] = useState({ other_user: null, messages: [] });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/messages/${otherUserId}`);
      setThread(data);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 80);
    } catch {
      toast.error("Konuşma yüklenemedi");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [otherUserId]);

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${otherUserId}`, { content: text.trim() });
      setThread((prev) => ({ ...prev, messages: [...prev.messages, data] }));
      setText("");
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch {
      toast.error("Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-thread">
      <header className="flex items-center gap-3 p-3 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <Button size="icon" variant="ghost" onClick={onBack} className="text-zinc-400" data-testid="chat-back-btn">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        {thread.other_user && (
          <Link
            to={`/app/artist/${thread.other_user.user_id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
              {thread.other_user.picture ? (
                <img src={thread.other_user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-zinc-100 text-sm">
                  {thread.other_user.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="font-display font-bold text-sm text-zinc-100">
              {thread.other_user.name}
            </div>
          </Link>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
        {thread.messages.map((m) => {
          const mine = m.sender_id === user?.user_id;
          return (
            <motion.div
              key={m.message_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  mine
                    ? "bg-gradient-to-br from-rose-500 to-indigo-600 text-white rounded-br-md"
                    : "bg-zinc-900 text-zinc-100 rounded-bl-md border border-zinc-800"
                }`}
              >
                <p className="text-sm leading-relaxed">{m.content}</p>
                <div className="text-[10px] opacity-60 mt-1 text-right font-mono">
                  {new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <form onSubmit={send} className="p-3 border-t border-zinc-900 flex gap-2 bg-zinc-950">
        <Input
          data-testid="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz..."
          className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-full"
        />
        <Button
          type="submit"
          data-testid="chat-send-btn"
          disabled={!text.trim() || sending}
          size="icon"
          className="rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default function Messages() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/messages/conversations");
        setList(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (userId) {
    return <ChatThread otherUserId={userId} onBack={() => navigate("/app/messages")} />;
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28" data-testid="messages-page">
      <header className="px-5 pt-5 pb-3 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-rose-400" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">
            Mesajlar
          </span>
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-zinc-50">
          Konuşmaların
        </h1>
      </header>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
        </div>
      ) : (
        <ConversationList
          list={list}
          activeId={null}
          onSelect={(id) => navigate(`/app/messages/${id}`)}
        />
      )}
    </div>
  );
}
