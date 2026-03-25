import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Loader2, Phone, Video } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessages, useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function ChatDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const convId = params.get('id') || '';
  const { profile } = useAuth();
  const { messages, loading, sendMessage } = useMessages(convId);
  const { conversations } = useConversations();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find(c => c.id === convId);
  const otherUser = conversation?.other_profile;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(content);
    } catch (e) {
      setText(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex-shrink-0 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/messages')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => otherUser && navigate(`/profile/${otherUser.username}`)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback className="bg-secondary font-bold text-sm">
                {otherUser?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{otherUser?.full_name || 'Loading...'}</p>
            <p className="text-[10px] text-green-500 font-medium">Active now</p>
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Phone size={16} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Video size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback className="bg-secondary font-bold text-2xl">
                {otherUser?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-bold text-foreground">{otherUser?.full_name}</p>
            <p className="text-xs text-muted-foreground">@{otherUser?.username}</p>
            <p className="text-xs text-muted-foreground mt-2">Send a message to start the conversation</p>
          </div>
        ) : (
          grouped.map(({ dateLabel, msgs }) => (
            <div key={dateLabel}>
              <div className="flex justify-center my-4">
                <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {dateLabel}
                </span>
              </div>
              {msgs.map((msg: any, i: number) => {
                const isMe = msg.sender_id === profile?.id;
                const prevMsg = msgs[i - 1];
                const sameUser = prevMsg?.sender_id === msg.sender_id;
                const isLast = i === msgs.length - 1 || msgs[i + 1]?.sender_id !== msg.sender_id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "flex gap-2 mb-0.5",
                      isMe ? "justify-end" : "justify-start",
                      !sameUser && "mt-3"
                    )}
                  >
                    {!isMe && isLast && (
                      <Avatar className="h-6 w-6 flex-shrink-0 self-end mb-0.5">
                        <AvatarImage src={msg.sender?.avatar_url} />
                        <AvatarFallback className="text-[9px] font-bold bg-secondary">
                          {msg.sender?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isMe && !isLast && <div className="w-6 flex-shrink-0" />}

                    <div className={cn(
                      "max-w-[72%] group relative",
                      isMe ? "items-end" : "items-start"
                    )}>
                      {msg.media_url && (
                        <img src={msg.media_url} className="rounded-2xl max-w-full mb-1 max-h-48 object-cover" alt="" />
                      )}
                      {msg.content && (
                        <div className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isMe
                            ? "bg-primary text-primary-foreground font-medium rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        )}>
                          {msg.content}
                        </div>
                      )}
                      {isLast && (
                        <p className={cn(
                          "text-[9px] text-muted-foreground mt-0.5 px-1",
                          isMe && "text-right"
                        )}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                          {isMe && msg.read_at && ' · Seen'}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-border px-3 py-3 pb-safe flex items-center gap-2 bg-background">
        <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
          <Paperclip size={16} />
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Message..."
          className="flex-1 bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/30 transition-colors"
        />
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-9 h-9 bg-primary rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          {sending
            ? <Loader2 size={14} className="animate-spin text-primary-foreground" />
            : <Send size={14} className="text-primary-foreground" />
          }
        </motion.button>
      </div>
    </div>
  );
}

function groupMessagesByDate(messages: any[]) {
  const groups: { dateLabel: string; msgs: any[] }[] = [];
  let currentDate = '';

  for (const msg of messages) {
    const d = new Date(msg.created_at);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d, yyyy');
    if (label !== currentDate) {
      currentDate = label;
      groups.push({ dateLabel: label, msgs: [] });
    }
    groups[groups.length - 1].msgs.push(msg);
  }

  return groups;
}
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
