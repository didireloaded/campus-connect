import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Image as ImageIcon, DollarSign } from "lucide-react";

const CATEGORIES = ["textbooks", "electronics", "furniture", "clothing", "services", "other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export default function CreateMarketplace() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("marketplace_listings").insert({
      title: title.trim(),
      price: Number(price),
      description: description.trim(),
      category,
      condition,
      seller_id: user.id,
      university_id: profile.university_id,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Listing created!");
    navigate("/marketplace");
    setLoading(false);
  };

  return (
    <div className="bg-card min-h-full flex flex-col">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-bold text-foreground">New Listing</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !price || loading}
          className="bg-feature-marketplace text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="w-full h-32 bg-secondary rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
          <ImageIcon size={24} />
          <span className="text-xs font-medium">Photo upload coming soon</span>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Price (N$)</label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00" className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${category === cat ? "bg-feature-marketplace text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Condition</label>
          <div className="flex gap-2">
            {CONDITIONS.map((c) => (
              <button key={c} onClick={() => setCondition(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${condition === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item..." rows={4}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
        </div>
      </div>
    </div>
  );
}
