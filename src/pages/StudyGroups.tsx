import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, BookOpen, Users, UserPlus, LogOut, MessageCircle, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface StudyGroup {
  id: string;
  creator_id: string;
  name: string;
  course: string | null;
  description: string | null;
  max_members: number;
  members_count: number;
  created_at: string;
}

export default function StudyGroups() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myMemberships, setMyMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [groupsRes, membersRes] = await Promise.all([
      supabase.from("study_groups").select("*").order("created_at", { ascending: false }),
      user ? supabase.from("study_group_members").select("group_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setGroups((groupsRes.data as StudyGroup[]) || []);
    setMyMemberships((membersRes.data || []).map((m: any) => m.group_id));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: group, error } = await supabase.from("study_groups").insert({
      creator_id: user.id, university_id: profile.university_id,
      name: name.trim(), course: course.trim() || null, description: description.trim() || null,
    } as any).select("id").single();
    if (error) { toast.error(error.message); return; }
    if (group) await supabase.from("study_group_members").insert({ group_id: group.id, user_id: user.id } as any);
    toast.success("Study group created!");
    setSheetOpen(false); setName(""); setCourse(""); setDescription("");
    fetch();
  };

  const toggleJoin = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isMember = myMemberships.includes(groupId);
    if (isMember) {
      await supabase.from("study_group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      toast.success("Left group");
    } else {
      await supabase.from("study_group_members").insert({ group_id: groupId, user_id: user.id } as any);
      toast.success("Joined group!");
    }
    fetch();
  };

  const myGroups = groups.filter((g) => myMemberships.includes(g.id));
  const otherGroups = groups.filter((g) => !myMemberships.includes(g.id));

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-studygroups))]/15 flex items-center justify-center">
                <BookOpen size={14} className="text-[hsl(var(--feature-studygroups))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Study Groups</h1>
            </div>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-studygroups))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 pb-20 space-y-5">
        {/* My groups section */}
        {myGroups.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap size={12} /> Your Groups
            </h3>
            <div className="space-y-2">
              {myGroups.map((g) => (
                <motion.div key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-xl border border-[hsl(var(--feature-studygroups))]/20 p-4 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[hsl(var(--feature-studygroups))]/10 flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-[hsl(var(--feature-studygroups))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{g.name}</h3>
                      {g.course && <p className="text-[11px] text-[hsl(var(--feature-studygroups))] font-medium">{g.course}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Users size={10} /> {g.members_count}/{g.max_members}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/study-group?id=${g.id}`)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-semibold bg-[hsl(var(--feature-studygroups))] text-white">
                        <MessageCircle size={12} /> Open
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Available groups */}
        {otherGroups.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Available Groups
            </h3>
            <div className="space-y-2">
              {otherGroups.map((g) => (
                <motion.div key={g.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{g.name}</h3>
                      {g.course && <p className="text-[11px] text-[hsl(var(--feature-studygroups))] font-medium">{g.course}</p>}
                      {g.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Users size={10} /> {g.members_count}/{g.max_members} members
                      </p>
                    </div>
                    <button onClick={() => toggleJoin(g.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-semibold bg-[hsl(var(--feature-studygroups))]/10 text-[hsl(var(--feature-studygroups))]">
                      <UserPlus size={12} /> Join
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-studygroups))]/10 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={28} className="text-[hsl(var(--feature-studygroups))]" />
            </div>
            <p className="font-semibold text-foreground">No study groups yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create one for your course</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Create Study Group</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="Course (e.g. CSI 101)" value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Textarea placeholder="What will you study? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-secondary border-0 resize-none" />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-[hsl(var(--feature-studygroups))] text-white font-semibold">Create Group</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
