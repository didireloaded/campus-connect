import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: pollsData } = await supabase.from("polls").select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!pollsData) { setLoading(false); return; }

    const enriched: PollWithVotes[] = [];
    for (const p of pollsData as any[]) {
      const opts = (p.options as string[]) || [];
      const { data: votes } = await supabase.from("poll_votes").select("option_index").eq("poll_id", p.id);
      const voteCounts = opts.map((_: string, i: number) => (votes || []).filter((v: any) => v.option_index === i).length);
      const myVote = user ? (votes || []).find((v: any) => v.user_id === user.id)?.option_index ?? null : null;
      enriched.push({ ...p, options: opts, voteCounts, myVote } as any);
    }
    setPolls(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchPolls(); }, []);

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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Campus Polls</h1>
          <p className="text-[10px] text-muted-foreground">Vote on what matters</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 space-y-4 py-4 pb-20">
        {polls.map((poll) => {
          const totalVotes = poll.voteCounts.reduce((a, b) => a + b, 0);
          return (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-foreground text-sm mb-3">{poll.question}</h3>
              <div className="space-y-2">
                {poll.options.map((opt, i) => {
                  const pct = totalVotes > 0 ? Math.round((poll.voteCounts[i] / totalVotes) * 100) : 0;
                  const voted = poll.myVote !== null;
                  return (
                    <button key={i} onClick={() => !voted && handleVote(poll.id, i)}
                      disabled={voted}
                      className="w-full relative overflow-hidden rounded-lg border border-border p-2.5 text-left">
                      {voted && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          className={`absolute inset-y-0 left-0 ${poll.myVote === i ? "bg-primary/15" : "bg-secondary"}`} />
                      )}
                      <span className="relative text-xs font-medium text-foreground flex justify-between">
                        <span>{opt}</span>
                        {voted && <span className="text-muted-foreground">{pct}%</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{totalVotes} votes</p>
            </motion.div>
          );
        })}
        {!loading && polls.length === 0 && (
          <div className="text-center py-16">
            <BarChart3 size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No active polls</p>
            <p className="text-sm text-muted-foreground">Create a poll about campus life</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Create Poll</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Your question" value={question} onChange={(e) => setQuestion(e.target.value)} />
            {options.map((opt, i) => (
              <Input key={i} placeholder={`Option ${i + 1}`} value={opt}
                onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} />
            ))}
            {options.length < 4 && (
              <button onClick={() => setOptions([...options, ""])}
                className="text-xs text-primary font-semibold">+ Add option</button>
            )}
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Create Poll</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
