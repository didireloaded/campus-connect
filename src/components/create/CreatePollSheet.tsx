import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreatePollSheet = ({ open, onClose }: Props) => {
  const { profile } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const validOpts = options.filter((o) => o.trim());
    if (!question.trim() || validOpts.length < 2 || !profile?.university_id) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from("polls").insert({
      user_id: user.id,
      university_id: profile.university_id,
      question: question.trim(),
      options: validOpts.map((o) => o.trim()),
    } as any);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Poll created!");
    setQuestion(""); setOptions(["", ""]); setLoading(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader><SheetTitle>Create Poll</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Input placeholder="Your question" value={question} onChange={(e) => setQuestion(e.target.value)} />
          {options.map((opt, i) => (
            <Input key={i} placeholder={`Option ${i + 1}`} value={opt}
              onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} />
          ))}
          {options.length < 4 && (
            <button onClick={() => setOptions([...options, ""])} className="text-xs text-primary font-semibold">+ Add option</button>
          )}
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Create Poll"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
