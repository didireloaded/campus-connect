import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Heart, Send, Ghost } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { generateAlias } from "@/services/wallService";

interface Confession {
  id: string;
  content: string;
  alias: string | null;
  reactions_count: number;
  created_at: string;
}

export default function Confessions() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchConfessions = async () => {
    const { data } = await supabase.from("confessions").select("*")
      .eq("moderation_status", "approved")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setConfessions((data as Confession[]) || []);
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Confessions</h1>
          <p className="text-[10px] text-muted-foreground">Anonymous • Disappears in 48h</p>
        </div>
      </header>

      {/* Quick post */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <Textarea placeholder="Confess something... 🤫" value={content}
            onChange={(e) => setContent(e.target.value)} rows={2}
            className="flex-1 resize-none text-sm" maxLength={500} />
          <button onClick={handlePost} disabled={posting || !content.trim()}
            className="self-end w-10 h-10 bg-primary rounded-full flex items-center justify-center disabled:opacity-50">
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Your identity is completely hidden</p>
      </div>

      <div className="px-4 space-y-3 py-4 pb-20">
        {confessions.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Ghost size={14} className="text-purple-500" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{c.alias || "Anonymous"}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
            <div className="flex items-center gap-3 mt-3">
              <button className="flex items-center gap-1 text-xs text-muted-foreground">
                <Heart size={14} /> {c.reactions_count}
              </button>
            </div>
          </motion.div>
        ))}
        {!loading && confessions.length === 0 && (
          <div className="text-center py-16">
            <Ghost size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No confessions yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share a secret</p>
          </div>
        )}
      </div>
    </div>
  );
}
