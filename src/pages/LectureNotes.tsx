import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, FileText, Download, Upload, BookMarked, FolderOpen, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCourse, setActiveCourse] = useState("all");

  const fetchNotes = async () => {
    if (!profile?.university_id) return;
    const { data } = await supabase.from("lecture_notes").select("*")
      .eq("university_id", profile.university_id)
      .order("created_at", { ascending: false });
    setNotes((data as Note[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [profile?.university_id]);

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

  // Group by course
  const courses = Array.from(new Set(notes.map((n) => n.course).filter(Boolean))) as string[];
  const filtered = notes.filter((n) => {
    const matchSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.course?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = activeCourse === "all" || n.course === activeCourse;
    return matchSearch && matchCourse;
  });

  const FILE_COLORS: Record<string, string> = {
    pdf: "bg-destructive/10 text-destructive",
    doc: "bg-[hsl(var(--feature-studygroups))]/10 text-[hsl(var(--feature-studygroups))]",
    docx: "bg-[hsl(var(--feature-studygroups))]/10 text-[hsl(var(--feature-studygroups))]",
    ppt: "bg-[hsl(var(--feature-spotted))]/10 text-[hsl(var(--feature-spotted))]",
    pptx: "bg-[hsl(var(--feature-spotted))]/10 text-[hsl(var(--feature-spotted))]",
    txt: "bg-secondary text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-notes))]/15 flex items-center justify-center">
                <BookMarked size={14} className="text-[hsl(var(--feature-notes))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Library</h1>
            </div>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-notes))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Course tabs */}
        {courses.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCourse("all")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                activeCourse === "all" ? "bg-[hsl(var(--feature-notes))] text-white" : "bg-secondary text-muted-foreground"
              }`}
            >All</button>
            {courses.map((c) => (
              <button key={c} onClick={() => setActiveCourse(c)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                  activeCourse === c ? "bg-[hsl(var(--feature-notes))] text-white" : "bg-secondary text-muted-foreground"
                }`}
              >{c}</button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 space-y-2 py-3 pb-20">
        {filtered.map((n, i) => {
          const colorClass = FILE_COLORS[n.file_type?.toLowerCase() || ""] || "bg-secondary text-muted-foreground";
          return (
            <motion.div key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl border border-border p-3.5 shadow-card flex items-center gap-3"
            >
              {/* File type badge */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                <span className="text-[10px] font-bold uppercase">{n.file_type || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">{n.title}</h3>
                {n.course && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[hsl(var(--feature-notes))]/10 text-[hsl(var(--feature-notes))]">
                    {n.course}
                  </span>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {n.downloads_count} download{n.downloads_count !== 1 ? "s" : ""}
                </p>
              </div>
              <a href={n.file_url} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-[hsl(var(--feature-notes))]/10 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--feature-notes))]/20 transition-colors">
                <Download size={16} className="text-[hsl(var(--feature-notes))]" />
              </a>
            </motion.div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-notes))]/10 flex items-center justify-center mx-auto mb-3">
              <BookMarked size={28} className="text-[hsl(var(--feature-notes))]" />
            </div>
            <p className="font-semibold text-foreground">{searchQuery ? "No results" : "Library is empty"}</p>
            <p className="text-xs text-muted-foreground mt-1">{searchQuery ? "Try a different search" : "Upload your notes to help others"}</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Upload Notes</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="Course (e.g. CSI 101)" value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 text-muted-foreground hover:border-[hsl(var(--feature-notes))]/50 transition-colors bg-secondary/50">
              <Upload size={24} />
              <span className="text-xs font-medium">{file ? file.name : "Tap to select file"}</span>
            </button>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={handleUpload} disabled={uploading}
              className="w-full py-3 rounded-xl bg-[hsl(var(--feature-notes))] text-white font-semibold disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload to Library"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
