import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const UploadNotesSheet = ({ open, onClose }: Props) => {
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !file || !profile?.university_id) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("lecture-notes").upload(path, file);
    if (uploadErr) { toast.error("Upload failed"); setLoading(false); return; }

    const { data: urlData } = supabase.storage.from("lecture-notes").getPublicUrl(path);
    const { error } = await supabase.from("lecture_notes").insert({
      user_id: user.id,
      university_id: profile.university_id,
      title: title.trim(),
      course: course.trim() || null,
      file_url: urlData.publicUrl,
      file_type: ext || null,
    } as any);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Notes uploaded!");
    setTitle(""); setCourse(""); setFile(null); setLoading(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader><SheetTitle>Upload Lecture Notes</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Course (e.g. CSI 101)" value={course} onChange={(e) => setCourse(e.target.value)} />
          <button onClick={() => fileRef.current?.click()}
            className="w-full py-6 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors">
            <Upload size={24} />
            <span className="text-xs font-medium">{file ? file.name : "Tap to select file"}</span>
          </button>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleUpload} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Upload"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
