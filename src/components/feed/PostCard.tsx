import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

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
  onLikeToggle?: () => void;
}

export const PostCard = ({ post, onLikeToggle }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = async () => {
    if (!user) return;

    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLikesCount((c) => c - 1);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      setLikesCount((c) => c + 1);
    }
    setLiked(!liked);
    onLikeToggle?.();
  };

  const initials = post.profiles?.full_name
    ? post.profiles.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : post.profiles?.username?.[0]?.toUpperCase() || "?";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card px-4 py-4 shadow-card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={post.profiles?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{post.profiles?.username}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <button className="text-muted-foreground p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-foreground mb-3 leading-relaxed">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="rounded-lg overflow-hidden mb-3 bg-muted aspect-square">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1">
        <button onClick={handleLike} className="flex items-center gap-1.5 group">
          <Heart
            size={20}
            className={`transition-colors ${liked ? "fill-destructive text-destructive" : "text-muted-foreground group-hover:text-foreground"}`}
          />
          <span className="text-xs font-medium text-muted-foreground">{likesCount}</span>
        </button>
        <button className="flex items-center gap-1.5 group">
          <MessageCircle size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-xs font-medium text-muted-foreground">{post.comments_count}</span>
        </button>
        <button className="group ml-auto">
          <Share2 size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </motion.article>
  );
};
