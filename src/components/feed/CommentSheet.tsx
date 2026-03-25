import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, Send, Loader2, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCommentVote } from '@/hooks/useVotesAndBookmarks';
import { toast } from 'sonner';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentSheet({ open, onClose, postId, onCommentAdded }: Props) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && postId) fetchComments();
  }, [open, postId]);

  useEffect(() => {
    if (replyTo && inputRef.current) inputRef.current.focus();
  }, [replyTo]);

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles!comments_user_id_fkey(username, full_name, avatar_url)')
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    const topLevel = (data as any[]) || [];

    const withReplies = await Promise.all(topLevel.map(async (c: any) => {
      const { data: replies } = await supabase
        .from('comments')
        .select('*, profile:profiles!comments_user_id_fkey(username, full_name, avatar_url)')
        .eq('post_id', postId)
        .eq('parent_comment_id', c.id)
        .order('created_at', { ascending: true });
      return { ...c, replies: replies || [] };
    }));

    setComments(withReplies);
    setLoading(false);
  };

  const submit = async () => {
    if (!text.trim() || !profile?.id || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: profile.id,
        content: text.trim(),
        parent_comment_id: replyTo?.id || null,
      });
      if (error) throw error;
      setText('');
      setReplyTo(null);
      await fetchComments();
      onCommentAdded?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-w-lg mx-auto flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-9 h-1 bg-border rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                Comments {!loading && `(${comments.length})`}
              </h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={20} />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">💬</p>
                  <p className="text-sm font-semibold text-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to share your thoughts</p>
                </div>
              ) : (
                comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={() => setReplyTo(comment)}
                  />
                ))
              )}
            </div>

            <div className="flex-shrink-0 border-t border-border px-4 py-3 pb-safe">
              {replyTo && (
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 mb-2">
                  <CornerDownRight size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground flex-1 truncate">
                    Replying to <span className="font-semibold text-foreground">@{replyTo.profile?.username}</span>
                  </span>
                  <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-bold bg-secondary">
                    {profile?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
                  placeholder={replyTo ? `Reply to @${replyTo.profile?.username}...` : "Write a comment..."}
                  className="flex-1 bg-secondary/60 border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40 transition-colors"
                />
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={submit}
                  disabled={!text.trim() || submitting}
                  className="w-8 h-8 bg-primary rounded-full flex items-center justify-center disabled:opacity-40"
                >
                  {submitting
                    ? <Loader2 size={13} className="animate-spin text-primary-foreground" />
                    : <Send size={13} className="text-primary-foreground" />
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  const { score, myVote, vote } = useCommentVote(comment.id);
  const [showReplies] = useState(true);
  const initials = comment.profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
          <AvatarImage src={comment.profile?.avatar_url} />
          <AvatarFallback className="text-xs font-bold bg-secondary">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-secondary/40 rounded-2xl rounded-tl-sm px-3 py-2.5">
            <p className="text-xs font-semibold text-foreground mb-0.5">
              {comment.profile?.full_name || comment.profile?.username}
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => vote('up')}
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-semibold transition-colors",
                  myVote === 'up' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUp size={12} />
                <span>{score > 0 ? score : ''}</span>
              </button>
              <button
                onClick={() => vote('down')}
                className={cn(
                  "transition-colors",
                  myVote === 'down' ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowDown size={12} />
              </button>
            </div>
            <button onClick={onReply} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">
              Reply
            </button>
          </div>
        </div>
      </div>

      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 mt-2 space-y-3 border-l-2 border-border pl-3">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex gap-2">
              <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                <AvatarImage src={reply.profile?.avatar_url} />
                <AvatarFallback className="text-[9px] font-bold bg-secondary">
                  {reply.profile?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="bg-secondary/40 rounded-2xl rounded-tl-sm px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-foreground mb-0.5">
                    {reply.profile?.full_name || reply.profile?.username}
                  </p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{reply.content}</p>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5 px-1">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
