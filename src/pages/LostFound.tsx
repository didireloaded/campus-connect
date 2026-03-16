import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Search, MapPin, Plus, Package, Eye, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface LostFoundItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  item_type: string;
  location: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

export default function LostFound() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [itemType, setItemType] = useState<"lost" | "found">("lost");

  const fetchItems = async () => {
    let query = supabase.from("lost_found").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("item_type", filter);
    const { data } = await query;
    setItems((data as LostFoundItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const handleCreate = async () => {
    if (!title.trim() || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("lost_found").insert({
      user_id: user.id, university_id: profile.university_id,
      title: title.trim(), description: description.trim() || null,
      location: location.trim() || null, item_type: itemType,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`${itemType === "lost" ? "Lost" : "Found"} item posted!`);
    setSheetOpen(false); setTitle(""); setDescription(""); setLocation("");
    fetchItems();
  };

  const markResolved = async (id: string) => {
    await supabase.from("lost_found").update({ status: "resolved" } as any).eq("id", id);
    fetchItems();
    toast.success("Marked as resolved!");
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Lost & Found</h1>
          <p className="text-[10px] text-muted-foreground">Help your campus community</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="flex gap-2 px-4 py-3">
        {(["all", "lost", "found"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f === "all" ? "All" : f === "lost" ? "🔍 Lost" : "📦 Found"}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 pb-20">
        {items.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.item_type === "lost" ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                    {item.item_type === "lost" ? "LOST" : "FOUND"}
                  </span>
                  {item.status === "resolved" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">RESOLVED</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                {item.location && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin size={10} /> {item.location}
                  </p>
                )}
              </div>
              {item.status === "open" && item.user_id === profile?.id && (
                <button onClick={() => markResolved(item.id)} className="text-xs text-primary font-medium">
                  <CheckCircle size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No items yet</p>
            <p className="text-sm text-muted-foreground">Report a lost or found item</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Report an Item</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <div className="flex gap-2">
              {(["lost", "found"] as const).map((t) => (
                <button key={t} onClick={() => setItemType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold ${itemType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {t === "lost" ? "🔍 I Lost Something" : "📦 I Found Something"}
                </button>
              ))}
            </div>
            <Input placeholder="Item name" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Post</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
