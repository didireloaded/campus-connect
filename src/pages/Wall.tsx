import { useAuth } from "@/contexts/AuthContext";
import { useWallPosts } from "@/hooks/useWallPosts";
import { wallService, generateAlias } from "@/services/wallService";
import { supabase } from "@/integrations/supabase/client";
import { ArrowBigUp, ArrowBigDown, Flag, MessageCircle, Loader2, Ghost, Clock, Send, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";
import { useEffect, useState } from "react";
import { profileService } from "@/services/profileService";
import { Textarea } from "@/components/ui/textarea";

function TimeLeft({ createdAt }: { createdAt: string }) {
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const hoursLeft = differenceInHours(expiresAt, now);
  const minutesLeft = differenceInMinutes(expiresAt, now) % 60;
  if (hoursLeft <= 0 && minutesLeft <= 0) return null;
  return (
    <span className="text-[9px] text-primary font-semibold">
      🔥 {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
    </span>
  );
}

interface WallComment {
  id: string;
  alias: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

export default function Wall() {
  const { user, profile } = useAuth();
  const { posts, loading, refresh } = useWallPosts();
  const [uniName, setUniName] = useState("");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<WallComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; alias: string } | null>(null);

  useEffect(() => {
    if (profile?.university_id) {
      profileService.getUniversity(profile.university_id).then((uni) => {
        setUniName((uni as any).short_name || (uni as any).name || "Campus");
      }).catch(() => {});
    }
  }, [profile]);

  const handleUpvote = async (postId: string) => {
    if (!user) return;
    try { await wallService.upvote(postId, user.id); refresh(); }
    catch { toast.error("Failed to upvote"); }
  };

  const handleDownvote = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from("wall_downvotes").insert({ wall_post_id: postId, user_id: user.id } as any);
    if (error?.code === "23505") {
      await supabase.from("wall_downvotes").delete().eq("wall_post_id", postId).eq("user_id", user.id);
    }
    refresh();
  };

  const handleReport = async (postId: string) => {
    if (!user) return;
    try {
      await wallService.report(user.id, postId, "Inappropriate content");
      toast.success("Reported. We'll review it.");
    } catch { toast.error("Already reported"); }
  };

  const loadComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    setReplyTo(null);
    setCommentText("");
    const { data } = await supabase.from("wall_comments").select("*")
      .eq("wall_post_id", postId).order("created_at", { ascending: true });
    setComments((data as WallComment[]) || []);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !openComments) return;
    const alias = generateAlias();
    await supabase.from("wall_comments").insert({
      wall_post_id: openComments,
      alias,
      content: commentText.trim(),
      parent_id: replyTo?.id || null,
    } as any);
    setCommentText("");
    setReplyTo(null);
    loadComments(openComments);
  };

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Ghost size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground leading-tight">
              {uniName ? `${uniName} Wall` : "The Wall"}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={10} className="text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground font-medium">Anonymous · Vanishes in 24h</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-24 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">👻</p>
            <h3 className="text-xl font-bold text-foreground">The wall is empty</h3>
            <p className="text-sm text-muted-foreground mt-2">Be the first ghost. Tap + to post anonymously.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Ghost size={14} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-primary">{post.alias || "Anonymous"}</span>
                <div className="flex items-center gap-2 ml-auto">
                  <TimeLeft createdAt={post.created_at} />
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <p className="text-[15px] text-foreground/90 leading-relaxed pl-10">{post.content}</p>

              <div className="flex items-center gap-4 mt-3 pl-10">
                <button onClick={() => handleUpvote(post.id)} className="flex items-center gap-1 text-muted-foreground hover:text-campus-green transition-colors">
                  <ArrowBigUp size={22} />
                  <span className="text-xs font-semibold">{post.upvotes}</span>
                </button>
                <button onClick={() => handleDownvote(post.id)} className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors">
                  <ArrowBigDown size={22} />
                </button>
                <button onClick={() => loadComments(post.id)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle size={18} />
                  <span className="text-xs font-semibold">{(post as any).comments_count || 0}</span>
                </button>
                <button onClick={() => handleReport(post.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-auto">
                  <Flag size={16} />
                </button>
              </div>

              {/* Comments section */}
              <AnimatePresence>
                {openComments === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-border overflow-hidden"
                  >
                    {topLevelComments.map((c) => (
                      <div key={c.id} className="mb-3">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-lg bg-campus-purple/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Ghost size={10} className="text-campus-purple" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-campus-purple">{c.alias}</span>
                              <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                            </div>
                            <p className="text-xs text-foreground/80 mt-0.5">{c.content}</p>
                            <button onClick={() => setReplyTo({ id: c.id, alias: c.alias })}
                              className="text-[10px] text-muted-foreground hover:text-primary mt-1 font-medium">Reply</button>
                          </div>
                        </div>
                        {getReplies(c.id).map((r) => (
                          <div key={r.id} className="ml-7 mt-2 flex items-start gap-2">
                            <div className="w-4 h-4 rounded-md bg-campus-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Ghost size={8} className="text-campus-blue" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-campus-blue">{r.alias}</span>
                                <span className="text-[8px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                              </div>
                              <p className="text-[11px] text-foreground/70 mt-0.5">{r.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="mt-2">
                      {replyTo && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground">Replying to {replyTo.alias}</span>
                          <button onClick={() => setReplyTo(null)}><X size={10} className="text-muted-foreground" /></button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Textarea placeholder="Add anonymous comment..."
                          value={commentText} onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 resize-none text-xs min-h-0 h-8 py-1.5 rounded-xl" rows={1} maxLength={300} />
                        <button onClick={submitComment} disabled={!commentText.trim()}
                          className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center disabled:opacity-50 shrink-0">
                          <Send size={12} className="text-primary-foreground" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
