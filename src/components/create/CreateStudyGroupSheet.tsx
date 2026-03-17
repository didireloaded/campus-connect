import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateStudyGroupSheet = ({ open, onClose }: Props) => {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !profile?.university_id) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: group, error } = await supabase.from("study_groups").insert({
      creator_id: user.id,
      university_id: profile.university_id,
      name: name.trim(),
      course: course.trim() || null,
      description: description.trim() || null,
    } as any).select("id").single();
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (group) {
      await supabase.from("study_group_members").insert({ group_id: group.id, user_id: user.id } as any);
    }
    toast.success("Study group created!");
    setName(""); setCourse(""); setDescription(""); setLoading(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader><SheetTitle>Create Study Group</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Course (e.g. CSI 101)" value={course} onChange={(e) => setCourse(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Create Group"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
