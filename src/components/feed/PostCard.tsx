import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface PostCardProps {
  post: {
    id: string;
    content: string | null;
    image_url: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string | null;
      full_name: string | null;
    };
  };
  onUpdate?: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  // Check if current user already liked this post
  useEffect(() => {
    if (!user) return;
    supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLiked(true);
      });
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      setLikesCount((c) => c + 1);
      // Create notification for post owner
      if (post.profiles && user.id !== (post as any).user_id) {
        await supabase.from("notifications").insert({
          user_id: (post as any).user_id,
          actor_id: user.id,
          type: "like",
          reference_id: post.id,
        } as any);
      }
    }
    setLiked(!liked);
    onUpdate?.();
  };

  const initials = post.profiles?.full_name
    ? post.profiles.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : post.profiles?.username?.[0]?.toUpperCase() || "?";

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={post.profiles?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{post.profiles?.username}</p>
        </div>
        <button className="text-muted-foreground p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="bg-muted aspect-square">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 flex items-center gap-4">
        <button onClick={handleLike} className="group">
          <Heart
            size={24}
            className={`transition-all ${liked ? "fill-destructive text-destructive scale-110" : "text-foreground group-hover:text-muted-foreground"}`}
          />
        </button>
        <button className="group">
          <MessageCircle size={24} className="text-foreground group-hover:text-muted-foreground transition-colors" />
        </button>
        <button className="group ml-auto">
          <Share2 size={22} className="text-foreground group-hover:text-muted-foreground transition-colors" />
        </button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <p className="px-4 text-[13px] font-semibold text-foreground">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-1">
          <p className="text-[13px] text-foreground">
            <span className="font-semibold mr-1.5">{post.profiles?.username}</span>
            {post.content}
          </p>
        </div>
      )}

      {/* Comments link */}
      {post.comments_count > 0 && (
        <button className="px-4 pb-1">
          <p className="text-[13px] text-muted-foreground">
            View all {post.comments_count} comments
          </p>
        </button>
      )}

      {/* Timestamp */}
      <p className="px-4 pb-3 text-[10px] text-muted-foreground uppercase tracking-wide">
        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
      </p>
    </motion.article>
  );
};
