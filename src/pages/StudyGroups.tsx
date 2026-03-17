import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, BookOpen, Users, UserPlus, LogOut, MessageCircle } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Study Groups</h1>
          <p className="text-[10px] text-muted-foreground">Learn together</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {groups.map((g) => {
          const isMember = myMemberships.includes(g.id);
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm">{g.name}</h3>
                  {g.course && <p className="text-xs text-primary font-medium mt-0.5">{g.course}</p>}
                  {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Users size={10} /> {g.members_count}/{g.max_members} members
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button onClick={() => toggleJoin(g.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${isMember ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                    {isMember ? <><LogOut size={12} /> Leave</> : <><UserPlus size={12} /> Join</>}
                  </button>
                  {isMember && (
                    <button onClick={() => navigate(`/study-group?id=${g.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                      <MessageCircle size={12} /> Chat
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {!loading && groups.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No study groups yet</p>
            <p className="text-sm text-muted-foreground">Create one for your course</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Create Study Group</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Course (e.g. CSI 101)" value={course} onChange={(e) => setCourse(e.target.value)} />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Create Group</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
