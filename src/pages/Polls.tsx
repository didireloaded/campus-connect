import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, BarChart3, Users, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes_count: number;
  expires_at: string;
  created_at: string;
}

interface PollWithVotes extends Poll {
  voteCounts: number[];
  myVote: number | null;
}

export default function Polls() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const fetchPolls = async () => {
    if (!profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: pollsData } = await supabase.from("polls").select("*")
      .eq("university_id", profile.university_id)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!pollsData) { setLoading(false); return; }

    const enriched = await Promise.all(
      (pollsData as any[]).map(async (p) => {
        const opts = (p.options as string[]) || [];
        const { data: votes } = await supabase.from("poll_votes").select("option_index, user_id").eq("poll_id", p.id);
        const voteCounts = opts.map((_: string, i: number) => (votes || []).filter((v: any) => v.option_index === i).length);
        let myVote: number | null = null;
        if (user) {
          const found = (votes || []).find((v: any) => v.user_id === user.id);
          if (found) myVote = found.option_index;
        }
        return { ...p, options: opts, voteCounts, myVote };
      })
    );
    setPolls(enriched as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchPolls(); }, [profile?.university_id]);

  const handleCreate = async () => {
    const validOpts = options.filter((o) => o.trim());
    if (!question.trim() || validOpts.length < 2 || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("polls").insert({
      user_id: user.id, university_id: profile.university_id,
      question: question.trim(), options: validOpts.map((o) => o.trim()),
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Poll created!");
    setSheetOpen(false); setQuestion(""); setOptions(["", ""]);
    fetchPolls();
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId, user_id: user.id, option_index: optionIndex,
    } as any);
    if (error?.code === "23505") { toast.error("Already voted!"); return; }
    if (error) { toast.error(error.message); return; }
    fetchPolls();
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Interactive header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-polls))]/15 flex items-center justify-center">
                <BarChart3 size={14} className="text-[hsl(var(--feature-polls))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Polls</h1>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-9">Vote on what matters</p>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-polls))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* Poll cards - interactive feel */}
      <div className="px-4 space-y-4 py-4 pb-20">
        {polls.map((poll, pi) => {
          const totalVotes = poll.voteCounts.reduce((a, b) => a + b, 0);
          const voted = poll.myVote !== null;
          const maxVotes = Math.max(...poll.voteCounts);
          return (
            <motion.div key={poll.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.05 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-card"
            >
              {/* Big question */}
              <h3 className="text-base font-bold text-foreground leading-snug mb-4">{poll.question}</h3>

              {/* Options */}
              <div className="space-y-2">
                {poll.options.map((opt, i) => {
                  const pct = totalVotes > 0 ? Math.round((poll.voteCounts[i] / totalVotes) * 100) : 0;
                  const isWinning = voted && poll.voteCounts[i] === maxVotes && maxVotes > 0;
                  const isMyVote = poll.myVote === i;

                  return (
                    <motion.button
                      key={i}
                      onClick={() => !voted && handleVote(poll.id, i)}
                      disabled={voted}
                      whileTap={!voted ? { scale: 0.98 } : undefined}
                      className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all ${
                        voted
                          ? "border border-border"
                          : "border-2 border-border hover:border-[hsl(var(--feature-polls))]/50 active:bg-[hsl(var(--feature-polls))]/5"
                      } ${isMyVote ? "border-[hsl(var(--feature-polls))]/40" : ""}`}
                    >
                      {/* Progress fill */}
                      {voted && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`absolute inset-y-0 left-0 rounded-xl ${
                            isMyVote
                              ? "bg-[hsl(var(--feature-polls))]/15"
                              : "bg-secondary"
                          }`}
                        />
                      )}

                      <span className="relative flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {isMyVote && <Check size={14} className="text-[hsl(var(--feature-polls))]" />}
                          <span className={`text-sm ${isMyVote ? "font-semibold text-foreground" : "text-foreground"}`}>{opt}</span>
                        </span>
                        {voted && (
                          <span className={`text-sm font-bold ${isWinning ? "text-[hsl(var(--feature-polls))]" : "text-muted-foreground"}`}>
                            {pct}%
                          </span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-2.5">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users size={11} /> {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
                </span>
              </div>
            </motion.div>
          );
        })}
        {!loading && polls.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-polls))]/10 flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={28} className="text-[hsl(var(--feature-polls))]" />
            </div>
            <p className="font-semibold text-foreground">No active polls</p>
            <p className="text-xs text-muted-foreground mt-1">Create a poll about campus life</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Create Poll</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Ask your campus a question..." value={question} onChange={(e) => setQuestion(e.target.value)} className="rounded-xl bg-secondary border-0 text-sm" />
            {options.map((opt, i) => (
              <Input key={i} placeholder={`Option ${i + 1}`} value={opt}
                onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                className="rounded-xl bg-secondary border-0" />
            ))}
            {options.length < 4 && (
              <button onClick={() => setOptions([...options, ""])}
                className="text-xs text-[hsl(var(--feature-polls))] font-semibold">+ Add option</button>
            )}
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-[hsl(var(--feature-polls))] text-white font-semibold">Create Poll</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
