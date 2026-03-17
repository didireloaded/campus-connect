import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, MapPin, Clock, Send } from "lucide-react";
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

  // Form
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

    // Fetch reactions
    if (postsData.length > 0) {
      const ids = postsData.map((p) => p.id);
      const { data: rxns } = await supabase.from("spotted_reactions" as any).select("*").in("post_id", ids);
      const counts: Record<string, ReactionCounts> = {};
      const mine: Record<string, string> = {};
      for (const p of postsData) {
        counts[p.id] = { wholesome: 0, funny: 0, interesting: 0 };
      }
      for (const r of (rxns || []) as any[]) {
        if (counts[r.post_id]) {
          counts[r.post_id][r.reaction as keyof ReactionCounts]++;
        }
        if (user && r.user_id === user.id) {
          mine[r.post_id] = r.reaction;
        }
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
      user_id: user.id,
      university_id: profile.university_id,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      spotted_time: spottedTime.trim() || null,
      is_anonymous: isAnonymous,
      alias: isAnonymous ? generateAlias() : null,
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
      // Remove reaction
      await supabase.from("spotted_reactions" as any).delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      if (current) {
        await supabase.from("spotted_reactions" as any).delete().eq("post_id", postId).eq("user_id", user.id);
      }
      await supabase.from("spotted_reactions" as any).insert({ post_id: postId, user_id: user.id, reaction } as any);
    }
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Spotted 👀</h1>
          <p className="text-[10px] text-muted-foreground">Campus moments & sightings</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {posts.map((post, i) => {
          const counts = reactions[post.id] || { wholesome: 0, funny: 0, interesting: 0 };
          return (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl p-4 border border-border shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-pink-500/10 rounded-full flex items-center justify-center">
                  <Eye size={16} className="text-pink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {post.is_anonymous ? post.alias || "Anonymous" : "A student"}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>

              <h3 className="font-bold text-foreground text-sm">{post.title}</h3>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{post.description}</p>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={10} /> {post.location}</span>
                {post.spotted_time && <span className="flex items-center gap-1"><Clock size={10} /> {post.spotted_time}</span>}
              </div>

              {post.image_url && (
                <img src={post.image_url} alt="" className="w-full rounded-xl mt-3 max-h-48 object-cover" loading="lazy" />
              )}

              {/* Reactions */}
              <div className="flex gap-2 mt-3">
                {REACTIONS.map((r) => {
                  const isActive = myReactions[post.id] === r.key;
                  return (
                    <button key={r.key} onClick={() => handleReaction(post.id, r.key)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:bg-accent"
                      }`}>
                      <span>{r.emoji}</span>
                      <span>{counts[r.key as keyof ReactionCounts]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <Eye size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No spotted posts yet</p>
            <p className="text-sm text-muted-foreground">Share a campus moment!</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Post a Spotted</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Title (e.g. Spotted at the library)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Input placeholder="Time (e.g. 2:30 PM today)" value={spottedTime} onChange={(e) => setSpottedTime(e.target.value)} />
            <Textarea placeholder="Description (max 500 chars)" value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className="resize-none" />
            <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded" />
                Post anonymously
              </label>
            </div>
            <button onClick={handleCreate}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">
              Post Spotted
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
