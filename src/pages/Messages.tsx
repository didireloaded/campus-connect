import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDirectMessages, DirectMessage } from "@/hooks/useDirectMessages";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function Messages() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const threadId = params.get("thread");
  const { user } = useAuth();
  const { threads, loading, fetchMessages, sendMessage } = useDirectMessages();

  // If a threadId is provided, show the conversation
  if (threadId) {
    return <ConversationView threadId={threadId} />;
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
            <p className="text-[10px] text-muted-foreground">Your conversations</p>
          </div>
        </div>
      </header>

      <div className="pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : threads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={28} className="text-primary" />
            </div>
            <p className="font-semibold text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start a conversation from a listing or profile</p>
          </div>
        ) : (
          threads.map((thread, i) => (
            <motion.button
              key={thread.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/messages?thread=${thread.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors border-b border-border text-left"
            >
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={thread.other_user?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {thread.other_user?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {thread.other_user?.full_name || thread.other_user?.username || "User"}
                  </p>
                  {thread.unread_count ? (
                    <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-primary-foreground">{thread.unread_count}</span>
                    </span>
                  ) : null}
                </div>
                {thread.last_message && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.last_message}</p>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

function ConversationView({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchMessages, sendMessage } = useDirectMessages();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const msgs = await fetchMessages(threadId);
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100);

      // Get thread info for header
      const { data: thread } = await supabase
        .from("dm_threads")
        .select("user_a, user_b")
        .eq("id", threadId)
        .single();
      if (thread && user) {
        const otherId = (thread as any).user_a === user.id ? (thread as any).user_b : (thread as any).user_a;
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url, full_name")
          .eq("id", otherId)
          .single();
        setOtherUser(profile);
      }
    };
    load();

    // Realtime
    const channel = supabase
      .channel(`dm-conv-${threadId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `thread_id=eq.${threadId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as DirectMessage]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await sendMessage(threadId, content);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/messages")}><ArrowLeft size={20} className="text-foreground" /></button>
        {otherUser && (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {otherUser.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold text-foreground">{otherUser.full_name || otherUser.username}</p>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ maxHeight: "calc(100vh - 140px)" }}>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={20} /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-12">Start the conversation</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                  isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[9px] mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-background pb-safe">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50">
          <Send size={16} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}
