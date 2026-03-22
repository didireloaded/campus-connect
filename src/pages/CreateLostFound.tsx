import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Calendar } from "lucide-react";

export default function CreateLostFound() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [itemType, setItemType] = useState<"lost" | "found">("lost");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("lost_found").insert({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      item_type: itemType,
      user_id: user.id,
      university_id: profile.university_id,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success(`${itemType === "lost" ? "Lost" : "Found"} item reported!`);
    navigate("/lost-found");
    setLoading(false);
  };

  return (
    <div className="bg-card min-h-full flex flex-col">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
          <span className="text-sm font-bold text-foreground">Report Lost/Found</span>
        </div>
        <button onClick={handleSubmit} disabled={!title.trim() || loading}
          className="bg-feature-lostfound text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Submit"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex gap-2">
          {(["lost", "found"] as const).map((t) => (
            <button key={t} onClick={() => setItemType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${itemType === t ? (t === "lost" ? "bg-destructive text-destructive-foreground" : "bg-feature-rides text-primary-foreground") : "bg-secondary text-muted-foreground"}`}>
              {t === "lost" ? "🔴 Lost" : "🟢 Found"}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Item Name</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="What was lost or found?" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was it lost/found?" className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item..." rows={4}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
        </div>
      </div>
    </div>
  );
}
