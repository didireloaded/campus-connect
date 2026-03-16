import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { notificationService } from "@/services/notificationService";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useEffect } from "react";

interface PostCardProps {
  post: {
    id: string;
    user_id?: string;
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

  useEffect(() => {
    if (!user) return;
    postService.isLiked(post.id, user.id).then(setLiked);
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;
    if (liked) {
      await postService.unlikePost(post.id, user.id);
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      await postService.likePost(post.id, user.id);
      setLikesCount((c) => c + 1);
      // Notify post owner
      if (post.user_id && post.user_id !== user.id) {
        notificationService.createNotification({
          userId: post.user_id,
          actorId: user.id,
          type: "like",
          referenceId: post.id,
        }).catch(() => {});
      }
    }
    setLiked(!liked);
    onUpdate?.();
  };

  const initials = post.profiles?.full_name
    ? post.profiles.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : post.profiles?.username?.[0]?.toUpperCase() || "?";

  return (
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={post.profiles?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{post.profiles?.username}</p>
        </div>
        <button className="text-muted-foreground p-1"><MoreHorizontal size={18} /></button>
      </div>

      {post.image_url && (
        <div className="bg-muted aspect-square"><img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
      )}

      <div className="px-4 py-2 flex items-center gap-4">
        <button onClick={handleLike} className="group">
          <Heart size={24} className={`transition-all ${liked ? "fill-destructive text-destructive scale-110" : "text-foreground group-hover:text-muted-foreground"}`} />
        </button>
        <button className="group"><MessageCircle size={24} className="text-foreground group-hover:text-muted-foreground transition-colors" /></button>
        <button className="group ml-auto"><Share2 size={22} className="text-foreground group-hover:text-muted-foreground transition-colors" /></button>
      </div>

      {likesCount > 0 && <p className="px-4 text-[13px] font-semibold text-foreground">{likesCount} {likesCount === 1 ? "like" : "likes"}</p>}
      {post.content && (
        <div className="px-4 pb-1"><p className="text-[13px] text-foreground"><span className="font-semibold mr-1.5">{post.profiles?.username}</span>{post.content}</p></div>
      )}
      {post.comments_count > 0 && <button className="px-4 pb-1"><p className="text-[13px] text-muted-foreground">View all {post.comments_count} comments</p></button>}
      <p className="px-4 pb-3 text-[10px] text-muted-foreground uppercase tracking-wide">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
    </motion.article>
  );
};
