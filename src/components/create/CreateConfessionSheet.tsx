import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { generateAlias } from "@/services/wallService";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateConfessionSheet = ({ open, onClose }: Props) => {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!content.trim() || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("confessions").insert({
      university_id: profile.university_id,
      content: content.trim(),
      alias: generateAlias(),
    } as any);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Confession posted anonymously!");
    setContent(""); setLoading(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader><SheetTitle>Post a Confession</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Textarea placeholder="Confess something... 🤫" value={content}
            onChange={(e) => setContent(e.target.value)} rows={4} maxLength={500}
            className="resize-none" />
          <p className="text-[10px] text-muted-foreground">Your identity is completely hidden. Disappears in 48h.</p>
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Post Anonymously"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
