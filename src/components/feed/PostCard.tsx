import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { notificationService } from "@/services/notificationService";
import {
  MessageCircle, Share2, MoreHorizontal,
  Send, X, Trash2, Flag, Bookmark, CheckCheck, Loader2
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
      toast.error("Failed to post reply");
    } finally {
      setPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl max-h-[80vh] flex flex-col shadow-modal border-t border-border"
          >
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-8 h-0.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2.5 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground">
                {commentsCount} {commentsCount === 1 ? "Reply" : "Replies"}
              </h3>
              <button onClick={onClose} className="text-muted-foreground p-1"><X size={16} /></button>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={20} />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No replies yet. Start the conversation.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={c.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
                        {c.profiles?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        <span className="font-semibold mr-1">{c.profiles?.username}</span>
                        {c.content}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-end gap-2.5 px-4 py-2.5 border-t border-border shrink-0 pb-safe">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); }
                }}
                placeholder="Write a reply…"
                rows={1}
                className="flex-1 bg-secondary rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-ring/30"
                style={{ minHeight: 36, maxHeight: 100 }}
              />
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
              >
                {posting ? <Loader2 size={13} className="animate-spin text-primary-foreground" /> : <Send size={13} className="text-primary-foreground" />}
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
  open, onClose, isOwn, onDelete, onReport,
}: {
  open: boolean; onClose: () => void; isOwn: boolean; onDelete: () => void; onReport: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -2 }}
            transition={{ duration: 0.1 }}
            className="absolute right-3 top-10 z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden min-w-[140px]"
          >
            {isOwn ? (
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-destructive hover:bg-destructive/10 w-full transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            ) : (
              <button
                onClick={() => { onReport(); onClose(); }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-foreground hover:bg-accent w-full transition-colors"
              >
                <Flag size={13} /> Report
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
  const [saved, setSaved] = useState(false);
  const isOwn = !!user && user.id === post.user_id;

  useEffect(() => {
    if (!user) return;
    postService.isLiked(post.id, user.id).then(setLiked);
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasLiked) {
        await postService.unlikePost(post.id, user.id);
      } else {
        await postService.likePost(post.id, user.id);
        if (post.user_id && post.user_id !== user.id) {
          notificationService.createNotification({
            userId: post.user_id, actorId: user.id, type: "like", referenceId: post.id,
          }).catch(() => {});
        }
      }
    } catch {
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
      toast.error("Failed to delete");
    }
  };

  const handleReport = async () => {
    if (!user) return;
    try {
      await supabase.from("reports").insert({
        reporter_id: user.id, content_type: "post", content_id: post.id,
        reason: "Inappropriate content", status: "pending",
      } as any);
      toast.success("Reported — we'll review it");
    } catch {
      toast.error("Already reported");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Campus post", url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
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
      <article className="bg-card relative rounded-xl border border-border shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{post.profiles?.full_name || post.profiles?.username}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="relative">
            <button onClick={() => setShowMore((v) => !v)} className="text-muted-foreground p-1 hover:text-foreground transition-colors">
              <MoreHorizontal size={16} />
            </button>
            <MoreMenu open={showMore} onClose={() => setShowMore(false)} isOwn={isOwn} onDelete={handleDelete} onReport={handleReport} />
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-3.5 pb-2">
            <p className="text-[13px] text-foreground leading-relaxed">
              {displayContent}
              {contentTooLong && !expanded && (
                <button onClick={() => setExpanded(true)} className="text-primary ml-1 font-medium text-xs">more</button>
              )}
            </p>
          </div>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="mx-3.5 mb-2.5 rounded-lg overflow-hidden bg-secondary">
            <img src={post.image_url} alt="" className="w-full object-cover" style={{ maxHeight: 320 }} loading="lazy" />
          </div>
        )}

        {/* Participation Actions */}
        <div className="px-3.5 py-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowComments(true)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle size={16} />
              <span className="text-[11px] font-medium">{commentsCount > 0 ? `${commentsCount} replies` : "Reply"}</span>
            </button>
            <button onClick={handleLike} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                liked ? "bg-primary/10 text-primary" : ""
              }`}>
                {liked ? "Interested" : "Interested"} {likesCount > 0 ? `· ${likesCount}` : ""}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSaved(!saved); toast.success(saved ? "Removed" : "Saved"); }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bookmark size={15} className={saved ? "fill-foreground text-foreground" : ""} />
            </button>
            <button onClick={handleShare} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <CheckCheck size={15} className="text-primary" /> : <Share2 size={15} />}
            </button>
          </div>
        </div>
      </article>

      <CommentSheet
        postId={post.id}
        open={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={commentsCount}
        onCommentPosted={() => { setCommentsCount((c) => c + 1); onUpdate?.(); }}
      />
    </>
  );
};
