import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Users, UserPlus, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Club {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  category: string | null;
  members_count: number;
  created_at: string;
}

export default function Clubs() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myMemberships, setMyMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [clubsRes, membersRes] = await Promise.all([
      supabase.from("clubs").select("*").order("members_count", { ascending: false }),
      user ? supabase.from("club_members").select("club_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setClubs((clubsRes.data as Club[]) || []);
    setMyMemberships((membersRes.data || []).map((m: any) => m.club_id));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: club, error } = await supabase.from("clubs").insert({
      creator_id: user.id, university_id: profile.university_id,
      name: name.trim(), category: category.trim() || null, description: description.trim() || null,
    } as any).select("id").single();
    if (error) { toast.error(error.message); return; }
    if (club) await supabase.from("club_members").insert({ club_id: club.id, user_id: user.id } as any);
    toast.success("Club created!");
    setSheetOpen(false); setName(""); setCategory(""); setDescription("");
    fetch();
  };

  const toggleJoin = async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isMember = myMemberships.includes(clubId);
    if (isMember) {
      await supabase.from("club_members").delete().eq("club_id", clubId).eq("user_id", user.id);
      toast.success("Left club");
    } else {
      await supabase.from("club_members").insert({ club_id: clubId, user_id: user.id } as any);
      toast.success("Joined club!");
    }
    fetch();
  };

  const categories = ["Academic", "Sports", "Arts", "Tech", "Social", "Religious"];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Clubs & Societies</h1>
          <p className="text-[10px] text-muted-foreground">Student organizations</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {clubs.map((club) => {
          const isMember = myMemberships.includes(club.id);
          return (
            <motion.div key={club.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm">{club.name}</h3>
                  {club.category && (
                    <span className="px-2 py-0.5 bg-secondary rounded-full text-[10px] font-semibold text-muted-foreground inline-block mt-0.5">
                      {club.category}
                    </span>
                  )}
                  {club.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{club.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Users size={10} /> {club.members_count} members
                  </p>
                </div>
                <button onClick={() => toggleJoin(club.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${isMember ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                  {isMember ? <><LogOut size={12} /> Leave</> : <><UserPlus size={12} /> Join</>}
                </button>
              </div>
            </motion.div>
          );
        })}
        {!loading && clubs.length === 0 && (
          <div className="text-center py-16">
            <Shield size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No clubs yet</p>
            <p className="text-sm text-muted-foreground">Start a student organization</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Create Club</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Club name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Create Club</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
