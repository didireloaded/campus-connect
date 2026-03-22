import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface OtherUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function ChatDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("id");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId || !user) return;

    // Fetch thread info
    const fetchThread = async () => {
      const { data: thread } = await supabase
        .from("dm_threads")
        .select("*")
        .eq("id", threadId)
        .single();

      if (!thread) { navigate("/messages"); return; }

      const otherId = thread.user_a === user.id ? thread.user_b : thread.user_a;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", otherId)
        .single();

      if (profile) setOtherUser(profile as OtherUser);
    };

    fetchThread();

    // Fetch messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    fetchMessages();

    // Realtime
    const channel = supabase
      .channel(`chat-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `thread_id=eq.${threadId}` }, () => {
        fetchMessages();
      })
      .subscribe();

    // Mark as read
    supabase.from("direct_messages")
      .update({ read: true })
      .eq("thread_id", threadId)
      .neq("sender_id", user.id)
      .then(() => {});

    return () => { supabase.removeChannel(channel); };
  }, [threadId, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !threadId || !user) return;
    await supabase.from("direct_messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = otherUser?.full_name || otherUser?.username || "User";
  const initials = displayName.substring(0, 1).toUpperCase();

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/messages")} className="text-foreground hover:text-foreground/80">
          <ArrowLeft size={20} />
        </button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground overflow-hidden border-2 border-card shadow-sm">
            {otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black text-foreground truncate">{displayName}</h1>
          <p className="text-[10px] text-muted-foreground font-medium">@{otherUser?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-[1.25rem] ${
                isMine
                  ? "bg-brand-purple text-white rounded-br-md"
                  : "bg-secondary text-foreground rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 glass border-t border-border px-4 py-3 safe-bottom">
        <div className="flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-secondary rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-brand-purple/20 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-11 h-11 bg-brand-purple rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-all active:scale-95 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
