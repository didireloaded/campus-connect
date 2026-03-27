import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Users, UserPlus, LogOut, Shield, Search } from "lucide-react";
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

const categoryColors: Record<string, { bg: string; text: string }> = {
  Academic: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  Sports: { bg: "bg-orange-500/15", text: "text-orange-600 dark:text-orange-400" },
  Arts: { bg: "bg-pink-500/15", text: "text-pink-600 dark:text-pink-400" },
  Tech: { bg: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
  Social: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  Religious: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
};

const iconColors: Record<string, string> = {
  Academic: "bg-blue-500/15",
  Sports: "bg-orange-500/15",
  Arts: "bg-pink-500/15",
  Tech: "bg-violet-500/15",
  Social: "bg-emerald-500/15",
  Religious: "bg-amber-500/15",
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    if (!profile?.university_id) return;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [clubsRes, membersRes] = await Promise.all([
        supabase.from("clubs").select("*")
          .eq("university_id", profile.university_id)
          .order("members_count", { ascending: false }),
        user
          ? supabase.from("club_members").select("club_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);
      setClubs((clubsRes.data as Club[]) || []);
      setMyMemberships((membersRes.data || []).map((m: any) => m.club_id));
      setLoading(false);
    };

    fetchData();
  }, [profile?.university_id]);

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
    fetchClubs();
  };

  const toggleJoin = async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in"); return; }
    const isMember = myMemberships.includes(clubId);
    try {
      if (isMember) {
        await supabase.from("club_members").delete().eq("club_id", clubId).eq("user_id", user.id);
        setMyMemberships(prev => prev.filter(id => id !== clubId));
        toast.success("Left club");
      } else {
        await supabase.from("club_members").insert({ club_id: clubId, user_id: user.id } as any);
        setMyMemberships(prev => [...prev, clubId]);
        toast.success("Joined club! 🎉");
      }
      // Refresh member count from trigger
      const { data: club } = await supabase.from("clubs").select("members_count").eq("id", clubId).single();
      if (club) {
        setClubs(prev => prev.map(c => c.id === clubId ? { ...c, members_count: club.members_count } : c));
      }
    } catch {
      toast.error("Failed to update membership");
    }
  };

  const allCategories = ["All", "Academic", "Sports", "Arts", "Tech", "Social", "Religious"];

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center">
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground">Organizations</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Student clubs & societies</p>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Plus size={18} className="text-primary-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-shadow"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                filterCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {filteredClubs.map((club, i) => {
          const isMember = myMemberships.includes(club.id);
          const colorSet = categoryColors[club.category || ""] || { bg: "bg-primary/10", text: "text-primary" };
          const iconBg = iconColors[club.category || ""] || "bg-primary/10";
          return (
            <motion.div key={club.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <span className="text-sm font-bold text-foreground">{club.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm">{club.name}</h3>
                  {club.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{club.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {club.category && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${colorSet.bg} ${colorSet.text}`}>
                        {club.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users size={10} /> {club.members_count} members
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleJoin(club.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${isMember ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground shadow-glow"}`}>
                  {isMember ? <><LogOut size={12} /> Leave</> : <><UserPlus size={12} /> Join</>}
                </button>
              </div>
            </motion.div>
          );
        })}
        {!loading && filteredClubs.length === 0 && (
          <div className="text-center py-16">
            <Shield size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No organizations found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try a different search" : "Start a student organization"}
            </p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Create Organization</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Organization name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {allCategories.filter(c => c !== "All").map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow">Create Organization</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
