import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, FileText, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Note {
  id: string;
  title: string;
  course: string | null;
  description: string | null;
  file_url: string;
  file_type: string | null;
  downloads_count: number;
  created_at: string;
}

export default function LectureNotes() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchNotes = async () => {
    const { data } = await supabase.from("lecture_notes").select("*").order("created_at", { ascending: false });
    setNotes((data as Note[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleUpload = async () => {
    if (!title.trim() || !file || !profile?.university_id) return;
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("lecture-notes").upload(path, file);
    if (uploadErr) { toast.error("Upload failed"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("lecture-notes").getPublicUrl(path);
    const { error } = await supabase.from("lecture_notes").insert({
      user_id: user.id, university_id: profile.university_id,
      title: title.trim(), course: course.trim() || null,
      file_url: urlData.publicUrl, file_type: ext || null,
    } as any);
    if (error) { toast.error(error.message); setUploading(false); return; }
    toast.success("Notes uploaded!");
    setSheetOpen(false); setTitle(""); setCourse(""); setFile(null);
    setUploading(false);
    fetchNotes();
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Lecture Notes</h1>
          <p className="text-[10px] text-muted-foreground">Share & download study materials</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {notes.map((n) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">{n.title}</h3>
              {n.course && <p className="text-xs text-primary font-medium">{n.course}</p>}
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                <span>{n.file_type?.toUpperCase()}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Download size={8} /> {n.downloads_count}</span>
              </p>
            </div>
            <a href={n.file_url} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Download size={16} className="text-primary" />
            </a>
          </motion.div>
        ))}
        {!loading && notes.length === 0 && (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No notes shared yet</p>
            <p className="text-sm text-muted-foreground">Upload your lecture notes to help others</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Upload Notes</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Course (e.g. CSI 101)" value={course} onChange={(e) => setCourse(e.target.value)} />
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors">
              <Upload size={24} />
              <span className="text-xs font-medium">{file ? file.name : "Tap to select file"}</span>
            </button>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={handleUpload} disabled={uploading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
