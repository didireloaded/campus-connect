import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Heart, Send, Ghost, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { generateAlias } from "@/services/wallService";
import { formatDistanceToNow } from "date-fns";

interface Confession {
  id: string;
  content: string;
  alias: string | null;
  reactions_count: number;
  created_at: string;
}

export default function Confessions() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const fetchConfessions = async () => {
    const { data } = await supabase.from("confessions").select("*")
      .eq("moderation_status", "approved")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    const items = (data as Confession[]) || [];
    setConfessions(items);
    setLoading(false);

    // Fetch reactions
    if (items.length > 0 && user) {
      const ids = items.map(c => c.id);
      const { data: reactions } = await supabase
        .from("confession_reactions" as any)
        .select("confession_id, user_id")
        .in("confession_id", ids);

      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      for (const r of (reactions || []) as any[]) {
        counts[r.confession_id] = (counts[r.confession_id] || 0) + 1;
        if (r.user_id === user.id) mine.add(r.confession_id);
      }
      setReactionCounts(counts);
      setMyReactions(mine);
    }
  };

  useEffect(() => { fetchConfessions(); }, []);

  const handlePost = async () => {
    if (!content.trim() || !profile?.university_id) return;
    setPosting(true);
    const { error } = await supabase.from("confessions").insert({
      university_id: profile.university_id,
      content: content.trim(),
      alias: generateAlias(),
    } as any);
    if (error) { toast.error(error.message); setPosting(false); return; }
    toast.success("Confession posted anonymously!");
    setContent("");
    setPosting(false);
    fetchConfessions();
  };

  const handleReact = async (confessionId: string) => {
    if (!user) return;
    const alreadyReacted = myReactions.has(confessionId);

    // Optimistic update
    const newMine = new Set(myReactions);
    const newCounts = { ...reactionCounts };
    if (alreadyReacted) {
      newMine.delete(confessionId);
      newCounts[confessionId] = Math.max(0, (newCounts[confessionId] || 1) - 1);
    } else {
      newMine.add(confessionId);
      newCounts[confessionId] = (newCounts[confessionId] || 0) + 1;
    }
    setMyReactions(newMine);
    setReactionCounts(newCounts);

    try {
      if (alreadyReacted) {
        await supabase.from("confession_reactions" as any)
          .delete()
          .eq("confession_id", confessionId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("confession_reactions" as any).insert({
          confession_id: confessionId,
          user_id: user.id,
          reaction: "heart",
        } as any);
      }
    } catch {
      // Revert on error
      setMyReactions(myReactions);
      setReactionCounts(reactionCounts);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-confessions))]/15 flex items-center justify-center">
                <Ghost size={14} className="text-[hsl(var(--feature-confessions))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Confessions</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Shield size={12} />
            <span className="text-[10px] font-medium">Anonymous</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="bg-card rounded-xl border border-border p-3 shadow-card">
          <Textarea
            placeholder="What's on your mind? Your identity stays hidden..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none text-sm bg-transparent border-0 p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={11} />
              <span className="text-[10px]">Disappears in 48h</span>
            </div>
            <button onClick={handlePost} disabled={posting || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[hsl(var(--feature-confessions))] text-white text-xs font-semibold disabled:opacity-40 transition-opacity">
              <Send size={12} /> Confess
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-20">
        {confessions.map((c, i) => {
          const count = reactionCounts[c.id] || c.reactions_count || 0;
          const reacted = myReactions.has(c.id);
          return (
            <motion.div key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl p-4 border border-border shadow-card"
            >
              <p className="text-[13px] text-foreground leading-relaxed">{c.content}</p>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--feature-confessions))]/10 flex items-center justify-center">
                    <Ghost size={10} className="text-[hsl(var(--feature-confessions))]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">{c.alias || "Anonymous"}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <button
                  onClick={() => handleReact(c.id)}
                  className={`flex items-center gap-1 transition-colors ${
                    reacted ? "text-[hsl(var(--feature-confessions))]" : "text-muted-foreground hover:text-[hsl(var(--feature-confessions))]"
                  }`}
                >
                  <Heart size={14} className={reacted ? "fill-current" : ""} />
                  {count > 0 && <span className="text-[11px]">{count}</span>}
                </button>
              </div>
            </motion.div>
          );
        })}
        {!loading && confessions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--feature-confessions))]/10 flex items-center justify-center mx-auto mb-3">
              <Ghost size={28} className="text-[hsl(var(--feature-confessions))]" />
            </div>
            <p className="font-semibold text-foreground">No confessions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to share a secret</p>
          </div>
        )}
      </div>
    </div>
  );
}
