import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowBigUp, Flag, MessageCircle, Loader2, Ghost, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface WallPost {
  id: string;
  content: string;
  upvotes: number;
  alias: string | null;
  created_at: string;
}

export default function Wall() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpvote = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from("wall_upvotes").insert({
      wall_post_id: postId,
      user_id: user.id,
    });
    if (error && error.code === "23505") {
      await supabase.from("wall_upvotes").delete().eq("wall_post_id", postId).eq("user_id", user.id);
    }
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-campus-ghost">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-campus-ghost/90 backdrop-blur-xl px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Ghost size={22} className="text-campus-orange" />
          <h1 className="text-xl font-extrabold tracking-tight text-primary-foreground">
            The Wall
          </h1>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Clock size={12} className="text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">Anonymous · Posts vanish in 24 hours</p>
        </div>
      </header>

      {/* Feed */}
      <div className="px-4 pt-2 pb-20 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-campus-orange" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👻</p>
            <p className="font-semibold text-primary-foreground">The wall is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first ghost. Tap + to post anonymously.
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
              className="bg-muted/8 rounded-2xl p-4 border border-muted/10 backdrop-blur-sm"
            >
              {/* Alias */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-campus-orange/20 flex items-center justify-center">
                  <Ghost size={14} className="text-campus-orange" />
                </div>
                <span className="text-xs font-bold text-campus-orange">
                  {post.alias || "Anonymous"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Content */}
              <p className="text-[15px] text-primary-foreground/90 leading-relaxed pl-9">
                {post.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-3 pl-9">
                <button
                  onClick={() => handleUpvote(post.id)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-campus-orange transition-colors group"
                >
                  <ArrowBigUp size={22} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">{post.upvotes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary-foreground transition-colors">
                  <MessageCircle size={18} />
                </button>
                <button className="text-muted-foreground hover:text-destructive transition-colors ml-auto">
                  <Flag size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
