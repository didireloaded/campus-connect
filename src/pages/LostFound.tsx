import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Plus, Package, CheckCircle, AlertTriangle, PackageCheck, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

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
      {/* Notice board header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-lostfound))]/15 flex items-center justify-center">
                <Package size={14} className="text-[hsl(var(--feature-lostfound))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Lost & Found</h1>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-9">Campus notice board</p>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-lostfound))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* Filter tabs - notice board style */}
      <div className="px-4 py-3 flex gap-2">
        {(["all", "lost", "found"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
              filter === f
                ? f === "lost"
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : f === "found"
                  ? "bg-[hsl(var(--feature-marketplace))]/10 border-[hsl(var(--feature-marketplace))]/30 text-[hsl(var(--feature-marketplace))]"
                  : "bg-secondary border-border text-foreground"
                : "bg-card border-border text-muted-foreground"
            }`}>
            {f === "all" ? "All Items" : f === "lost" ? "🔍 Lost" : "📦 Found"}
          </button>
        ))}
      </div>

      {/* Notice cards */}
      <div className="px-4 space-y-3 pb-20">
        {items.map((item, i) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-card rounded-xl border-l-4 border border-border p-4 shadow-card ${
              item.item_type === "lost" ? "border-l-destructive" : "border-l-[hsl(var(--feature-marketplace))]"
            } ${item.status === "resolved" ? "opacity-60" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                item.item_type === "lost" ? "bg-destructive/10" : "bg-[hsl(var(--feature-marketplace))]/10"
              }`}>
                {item.item_type === "lost"
                  ? <AlertTriangle size={18} className="text-destructive" />
                  : <PackageCheck size={18} className="text-[hsl(var(--feature-marketplace))]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    item.item_type === "lost"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-[hsl(var(--feature-marketplace))]/10 text-[hsl(var(--feature-marketplace))]"
                  }`}>
                    {item.item_type}
                  </span>
                  {item.status === "resolved" && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase tracking-wider">Resolved</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  {item.location && (
                    <span className="flex items-center gap-1"><MapPin size={10} /> {item.location}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {item.status === "open" && item.user_id === profile?.id && (
                <button onClick={() => markResolved(item.id)}
                  className="text-[10px] text-primary font-semibold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                  <CheckCircle size={12} /> Resolve
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-lostfound))]/10 flex items-center justify-center mx-auto mb-3">
              <Package size={28} className="text-[hsl(var(--feature-lostfound))]" />
            </div>
            <p className="font-semibold text-foreground">Notice board is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Report a lost or found item</p>
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
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    itemType === t
                      ? t === "lost"
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-[hsl(var(--feature-marketplace))]/10 border-[hsl(var(--feature-marketplace))]/30 text-[hsl(var(--feature-marketplace))]"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}>
                  {t === "lost" ? "🔍 I Lost Something" : "📦 I Found Something"}
                </button>
              ))}
            </div>
            <Input placeholder="Item name" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-secondary border-0 resize-none" />
            <Input placeholder="Last seen location" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-[hsl(var(--feature-lostfound))] text-white font-semibold">Post to Board</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
