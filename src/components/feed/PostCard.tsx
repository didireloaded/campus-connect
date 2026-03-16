import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { notificationService } from "@/services/notificationService";
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Send, X, Trash2, Flag, Copy, CheckCheck, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
}

// ─── Comment Sheet ────────────────────────────────────────────────────────────

function CommentSheet({
  postId,
  open,
  onClose,
  commentsCount,
  onCommentPosted,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
  commentsCount: number;
  onCommentPosted: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    postService
      .fetchComments(postId)
      .then((data) => setComments(data as unknown as Comment[]))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, postId]);

  const handlePost = async () => {
    if (!text.trim() || !user || posting) return;
    setPosting(true);
    try {
      await postService.createComment(postId, user.id, text.trim());
      setText("");
      const fresh = await postService.fetchComments(postId);
      setComments(fresh as unknown as Comment[]);
      onCommentPosted();
      setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border shrink-0">
              <h3 className="font-bold text-foreground">
                {commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}
              </h3>
              <button onClick={onClose} className="text-muted-foreground p-1">
                <X size={18} />
              </button>
            </div>
            {/* Comment list */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={22} />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={c.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {c.profiles?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground">
                        <span className="font-semibold mr-1.5">{c.profiles?.username}</span>
                        {c.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Input */}
            <div className="flex items-end gap-3 px-4 py-3 border-t border-border shrink-0 pb-safe">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); }
                }}
                placeholder="Add a comment…"
                rows={1}
                className="flex-1 bg-secondary rounded-2xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-primary/30"
                style={{ minHeight: 40, maxHeight: 120 }}
              />
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
              >
                {posting ? <Loader2 size={15} className="animate-spin text-primary-foreground" /> : <Send size={15} className="text-primary-foreground" />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── More Menu ────────────────────────────────────────────────────────────────

function MoreMenu({
  open,
  onClose,
  isOwn,
  onDelete,
  onReport,
}: {
  open: boolean;
  onClose: () => void;
  isOwn: boolean;
  onDelete: () => void;
  onReport: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-3 top-10 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
          >
            {isOwn ? (
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
              >
                <Trash2 size={15} />
                Delete post
              </button>
            ) : (
              <button
                onClick={() => { onReport(); onClose(); }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent w-full transition-colors"
              >
                <Flag size={15} />
                Report post
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isOwn = !!user && user.id === post.user_id;

  useEffect(() => {
    if (!user) return;
    postService.isLiked(post.id, user.id).then(setLiked);
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;
    const wasLiked = liked;
    // Optimistic
    setLiked(!wasLiked);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasLiked) {
        await postService.unlikePost(post.id, user.id);
      } else {
        await postService.likePost(post.id, user.id);
        if (post.user_id && post.user_id !== user.id) {
          notificationService.createNotification({
            userId: post.user_id,
            actorId: user.id,
            type: "like",
            referenceId: post.id,
          }).catch(() => {});
        }
      }
    } catch {
      // Rollback on failure
      setLiked(wasLiked);
      setLikesCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
      toast.error("Failed");
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await postService.deletePost(post.id);
      toast.success("Post deleted");
      onUpdate?.();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleReport = async () => {
    if (!user) return;
    try {
      await supabase.from("reports").insert({
        reporter_id: user.id,
        content_type: "post",
        content_id: post.id,
        reason: "Inappropriate content",
        status: "pending",
      } as any);
      toast.success("Reported — we'll review it");
    } catch {
      toast.error("Already reported");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Campus post", url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const contentTooLong = (post.content?.length || 0) > 200;
  const displayContent = contentTooLong && !expanded
    ? post.content!.slice(0, 200) + "…"
    : post.content;

  const initials = post.profiles?.full_name
    ? post.profiles.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : post.profiles?.username?.[0]?.toUpperCase() || "?";

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card relative"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{post.profiles?.username}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-muted-foreground p-1 hover:text-foreground transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            <MoreMenu
              open={showMore}
              onClose={() => setShowMore(false)}
              isOwn={isOwn}
              onDelete={handleDelete}
              onReport={handleReport}
            />
          </div>
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
              className={`transition-all duration-150 ${
                liked
                  ? "fill-destructive text-destructive scale-110"
                  : "text-foreground group-hover:text-muted-foreground"
              }`}
            />
          </button>
          <button onClick={() => setShowComments(true)} className="group">
            <MessageCircle size={24} className="text-foreground group-hover:text-muted-foreground transition-colors" />
          </button>
          <button onClick={handleShare} className="group ml-auto">
            {copied
              ? <CheckCheck size={22} className="text-primary" />
              : <Share2 size={22} className="text-foreground group-hover:text-muted-foreground transition-colors" />
            }
          </button>
        </div>

        {/* Likes */}
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
              {displayContent}
              {contentTooLong && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-muted-foreground ml-1 font-medium"
                >
                  more
                </button>
              )}
            </p>
          </div>
        )}

        {/* Comments trigger */}
        {commentsCount > 0 && (
          <button onClick={() => setShowComments(true)} className="px-4 pb-1">
            <p className="text-[13px] text-muted-foreground">
              View all {commentsCount} comments
            </p>
          </button>
        )}

        <p className="px-4 pb-3 text-[10px] text-muted-foreground uppercase tracking-wide sr-only">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </motion.article>

      {/* Comments Sheet */}
      <CommentSheet
        postId={post.id}
        open={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={commentsCount}
        onCommentPosted={() => {
          setCommentsCount((c) => c + 1);
          onUpdate?.();
        }}
      />
    </>
  );
};
