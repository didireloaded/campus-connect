import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CreateNotes() {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim() || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("lecture_notes").insert({
      title: title.trim(),
      course_code: courseCode.trim().toUpperCase() || null,
      description: description.trim(),
      file_url: fileUrl.trim(),
      user_id: user.id,
      university_id: profile.university_id,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Notes uploaded!");
    navigate("/lecture-notes");
    setLoading(false);
  };

  return (
    <div className="bg-card min-h-full flex flex-col">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
          <span className="text-sm font-bold text-foreground">Upload Notes</span>
        </div>
        <button onClick={handleSubmit} disabled={!title.trim() || !fileUrl.trim() || loading}
          className="bg-feature-notes text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., CS201 Midterm Notes" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Course Code</label>
          <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)}
            placeholder="e.g., CS201" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase text-foreground" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">File URL</label>
          <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
            placeholder="Link to your notes (Google Drive, etc.)" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What topics do these notes cover?" rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
        </div>
      </div>
    </div>
  );
}
