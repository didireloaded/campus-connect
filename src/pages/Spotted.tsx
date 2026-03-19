import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { generateAlias } from "@/services/wallService";
import { formatDistanceToNow } from "date-fns";

interface SpottedPost {
  id: string;
  title: string;
  description: string;
  location: string;
  spotted_time: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  alias: string | null;
  user_id: string;
  created_at: string;
}

interface ReactionCounts {
  wholesome: number;
  funny: number;
  interesting: number;
}

const REACTIONS = [
  { key: "wholesome", emoji: "❤️", label: "Wholesome" },
  { key: "funny", emoji: "😂", label: "Funny" },
  { key: "interesting", emoji: "👀", label: "Interesting" },
] as const;

export default function Spotted() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SpottedPost[]>([]);
  const [reactions, setReactions] = useState<Record<string, ReactionCounts>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [spottedTime, setSpottedTime] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("spotted_posts" as any).select("*").order("created_at", { ascending: false });
    const postsData = (data || []) as unknown as SpottedPost[];
    setPosts(postsData);

    if (postsData.length > 0) {
      const ids = postsData.map((p) => p.id);
      const { data: rxns } = await supabase.from("spotted_reactions" as any).select("*").in("post_id", ids);
      const counts: Record<string, ReactionCounts> = {};
      const mine: Record<string, string> = {};
      for (const p of postsData) counts[p.id] = { wholesome: 0, funny: 0, interesting: 0 };
      for (const r of (rxns || []) as any[]) {
        if (counts[r.post_id]) counts[r.post_id][r.reaction as keyof ReactionCounts]++;
        if (user && r.user_id === user.id) mine[r.post_id] = r.reaction;
      }
      setReactions(counts);
      setMyReactions(mine);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("spotted_posts" as any).insert({
      user_id: user.id, university_id: profile.university_id,
      title: title.trim(), description: description.trim(),
      location: location.trim(), spotted_time: spottedTime.trim() || null,
      is_anonymous: isAnonymous, alias: isAnonymous ? generateAlias() : null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Spotted posted!");
    setSheetOpen(false);
    setTitle(""); setDescription(""); setLocation(""); setSpottedTime(""); setIsAnonymous(false);
    fetchPosts();
  };

  const handleReaction = async (postId: string, reaction: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const current = myReactions[postId];
    if (current === reaction) {
      await supabase.from("spotted_reactions" as any).delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      if (current) await supabase.from("spotted_reactions" as any).delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.from("spotted_reactions" as any).insert({ post_id: postId, user_id: user.id, reaction } as any);
    }
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Expressive header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-spotted))]/15 flex items-center justify-center">
                <Eye size={14} className="text-[hsl(var(--feature-spotted))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Spotted</h1>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-9">Campus stories & sightings</p>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-spotted))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* Storytelling cards - more breathing room, expressive */}
      <div className="px-4 space-y-4 py-4 pb-20">
        {posts.map((post, i) => {
          const counts = reactions[post.id] || { wholesome: 0, funny: 0, interesting: 0 };
          return (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              {/* Image first if exists - storytelling hero */}
              {post.image_url && (
                <img src={post.image_url} alt="" className="w-full max-h-56 object-cover" loading="lazy" />
              )}

              <div className="p-4">
                {/* Title - larger for storytelling */}
                <h3 className="text-base font-bold text-foreground leading-snug">{post.title}</h3>

                {/* Description - generous line height */}
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{post.description}</p>

                {/* Context line */}
                <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {post.location}</span>
                  {post.spotted_time && <span className="flex items-center gap-1"><Clock size={11} /> {post.spotted_time}</span>}
                  <span className="ml-auto">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Reactions - bigger, more expressive */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  {REACTIONS.map((r) => {
                    const isActive = myReactions[post.id] === r.key;
                    const count = counts[r.key as keyof ReactionCounts];
                    return (
                      <button key={r.key} onClick={() => handleReaction(post.id, r.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[hsl(var(--feature-spotted))]/15 text-[hsl(var(--feature-spotted))] scale-105"
                            : "bg-secondary text-muted-foreground hover:bg-accent"
                        }`}>
                        <span className="text-base">{r.emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Anonymous tag */}
                <div className="mt-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    — {post.is_anonymous ? post.alias || "Anonymous" : "A student"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-spotted))]/10 flex items-center justify-center mx-auto mb-3">
              <Eye size={28} className="text-[hsl(var(--feature-spotted))]" />
            </div>
            <p className="font-semibold text-foreground">No stories yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share a campus moment!</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Share a Story</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="What happened? (title)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="Where?" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="When? (e.g. 2:30 PM today)" value={spottedTime} onChange={(e) => setSpottedTime(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Textarea placeholder="Tell the full story... (max 500 chars)" value={description}
              onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={500} className="resize-none rounded-xl bg-secondary border-0" />
            <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
                Post anonymously
              </label>
            </div>
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-[hsl(var(--feature-spotted))] text-white font-semibold">Share Story</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
