import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, FileText, Megaphone, Upload, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null } | null;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

type Tab = "chat" | "files" | "members";

export default function StudyGroupDetail() {
  const [params] = useSearchParams();
  const groupId = params.get("id");
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [groupName, setGroupName] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [tab, setTab] = useState<Tab>("chat");
  const [msgText, setMsgText] = useState("");
  const [loading, setLoading] = useState(true);
  const [announcementSheet, setAnnouncementSheet] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!groupId) return;
    loadGroup();
    loadMessages();
    loadAnnouncement();
    loadMembers();

    const channel = supabase
      .channel(`sg-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const msg = payload.new as any;
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  const loadGroup = async () => {
    if (!groupId) return;
    const { data } = await supabase.from("study_groups").select("name, creator_id").eq("id", groupId).single();
    if (data) { setGroupName((data as any).name); setCreatorId((data as any).creator_id); }
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!groupId) return;
    const { data } = await supabase.from("study_group_messages" as any)
      .select("*, profiles(username, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data || []) as unknown as Message[]);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
  };

  const loadAnnouncement = async () => {
    if (!groupId) return;
    const { data } = await supabase.from("study_group_announcements" as any)
      .select("*").eq("group_id", groupId).eq("is_active", true)
      .order("created_at", { ascending: false }).limit(1);
    if (data && (data as any[]).length > 0) setAnnouncement((data as any[])[0]);
  };

  const loadMembers = async () => {
    if (!groupId) return;
    const { data } = await supabase.from("study_group_members")
      .select("user_id, profiles(username, avatar_url)")
      .eq("group_id", groupId) as any;
    setMembers(data || []);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !user || !groupId) return;
    const text = msgText.trim();
    setMsgText("");
    await supabase.from("study_group_messages" as any).insert({
      group_id: groupId,
      sender_id: user.id,
      content: text,
      message_type: "text",
    } as any);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !groupId) return;
    const path = `${groupId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("study-group-files").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("study-group-files").getPublicUrl(path);
    await supabase.from("study_group_messages" as any).insert({
      group_id: groupId,
      sender_id: user.id,
      content: file.name,
      message_type: "file",
      file_url: urlData.publicUrl,
      file_name: file.name,
    } as any);
    toast.success("File shared!");
  };

  const postAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim() || !user || !groupId) return;
    // Deactivate old
    await supabase.from("study_group_announcements" as any).update({ is_active: false } as any).eq("group_id", groupId);
    await supabase.from("study_group_announcements" as any).insert({
      group_id: groupId, author_id: user.id, title: annTitle.trim(), body: annBody.trim(),
    } as any);
    // System message
    await supabase.from("study_group_messages" as any).insert({
      group_id: groupId, sender_id: user.id, content: `📢 ${profile?.username} pinned a new announcement`, message_type: "system",
    } as any);
    toast.success("Announcement posted!");
    setAnnouncementSheet(false); setAnnTitle(""); setAnnBody("");
    loadAnnouncement();
  };

  const isCreator = user?.id === creatorId;

  if (!groupId) return <div className="p-8 text-center text-muted-foreground">No group selected</div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground truncate">{groupName || "Study Group"}</h1>
          <p className="text-[10px] text-muted-foreground">{members.length} members</p>
        </div>
        {isCreator && (
          <button onClick={() => setAnnouncementSheet(true)}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Megaphone size={16} className="text-primary" />
          </button>
        )}
      </header>

      {/* Announcement banner */}
      {announcement && (
        <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
          <p className="text-xs font-bold text-primary">📢 {announcement.title}</p>
          <p className="text-[11px] text-foreground/80 mt-0.5">{announcement.body}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([["chat", "Chat"], ["files", "Files"], ["members", "Members"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === key ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {tab === "chat" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isSystem = msg.message_type === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-[10px] text-muted-foreground bg-secondary px-3 py-1 rounded-full">{msg.content}</span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={(msg as any).profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                        {(msg as any).profiles?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${isMe ? "ml-auto" : ""}`}>
                    {!isMe && (
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                        {(msg as any).profiles?.username}
                      </p>
                    )}
                    <div className={`rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                      {msg.message_type === "file" ? (
                        <a href={msg.file_url || "#"} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs underline">
                          <FileText size={14} /> {msg.file_name || "File"}
                        </a>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-background">
            <button onClick={() => fileRef.current?.click()}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Upload size={16} className="text-muted-foreground" />
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
            <Input
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 rounded-full"
            />
            <button onClick={sendMessage} disabled={!msgText.trim()}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50">
              <Send size={16} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Files tab */}
      {tab === "files" && (
        <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
          {messages.filter((m) => m.message_type === "file").length === 0 ? (
            <div className="text-center py-12">
              <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No files shared yet</p>
            </div>
          ) : (
            messages.filter((m) => m.message_type === "file").map((m) => (
              <a key={m.id} href={m.file_url || "#"} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </p>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
          {members.map((m: any) => (
            <div key={m.user_id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {m.profiles?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{m.profiles?.username}</p>
                {m.user_id === creatorId && (
                  <span className="text-[10px] text-primary font-medium">Admin</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcement sheet */}
      <Sheet open={announcementSheet} onOpenChange={setAnnouncementSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Pin Announcement</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
            <Textarea placeholder="Body" value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={3} className="resize-none" />
            <button onClick={postAnnouncement}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">
              Pin Announcement
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
