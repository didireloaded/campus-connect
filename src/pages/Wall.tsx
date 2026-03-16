import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowBigUp, Flag, Send, Loader2, Ghost } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface WallPost {
  id: string;
  content: string;
  upvotes: number;
  created_at: string;
}

export default function Wall() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("wall_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data as WallPost[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel("wall-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "wall_posts" }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handlePost = async () => {
    if (!content.trim() || !profile?.university_id) return;
    setPosting(true);
    const { error } = await supabase.from("wall_posts").insert({
      university_id: profile.university_id,
      content: content.trim(),
    });
    if (error) toast.error("Failed to post");
    else { setContent(""); fetchPosts(); }
    setPosting(false);
  };

  const handleUpvote = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from("wall_upvotes").insert({
      wall_post_id: postId,
      user_id: user.id,
    });
    if (error && error.code === "23505") {
      // Already upvoted, remove
      await supabase.from("wall_upvotes").delete().eq("wall_post_id", postId).eq("user_id", user.id);
    }
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-campus-ghost">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-campus-ghost/90 backdrop-blur-xl px-4 py-3 border-b border-muted/20">
        <div className="flex items-center gap-2">
          <Ghost size={20} className="text-campus-orange" />
          <h1 className="text-xl font-extrabold tracking-tight text-primary-foreground">
            The Wall
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Anonymous • Posts disappear in 24h</p>
      </header>

      {/* Compose */}
      <div className="px-4 py-3">
        <Textarea
          placeholder="Speak your mind anonymously..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-muted/20 border-muted/20 text-primary-foreground placeholder:text-muted-foreground min-h-[60px] resize-none focus-visible:ring-campus-orange/30"
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="bg-campus-orange hover:bg-campus-orange/90 text-primary-foreground"
          >
            <Send size={14} className="mr-1" />
            {posting ? "Posting..." : "Post Anonymously"}
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-2 px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-campus-orange" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-20">
            The wall is empty. Be the first ghost.
          </p>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
              className="bg-muted/10 rounded-xl p-4 border border-muted/10"
            >
              <p className="text-sm text-primary-foreground/90 leading-relaxed">{post.content}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-campus-orange transition-colors"
                  >
                    <ArrowBigUp size={20} />
                    <span className="text-xs font-medium">{post.upvotes}</span>
                  </button>
                  <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <Flag size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
