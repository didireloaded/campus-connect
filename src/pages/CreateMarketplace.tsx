import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Image as ImageIcon, DollarSign, X, Camera } from "lucide-react";

const CATEGORIES = ["textbooks", "electronics", "furniture", "clothing", "services", "other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export default function CreateMarketplace() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !user || !profile?.university_id) return;
    setLoading(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("marketplace-images").upload(path, imageFile);
      if (uploadErr) { toast.error("Image upload failed"); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from("marketplace-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("marketplace_listings").insert({
      title: title.trim(),
      price: Number(price),
      description: description.trim(),
      category,
      condition,
      seller_id: user.id,
      university_id: profile.university_id,
      image_url: imageUrl,
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
          className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Image upload */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        {imagePreview ? (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <X size={14} className="text-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full h-32 bg-secondary rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2 hover:border-primary/30 transition-colors">
            <Camera size={24} />
            <span className="text-xs font-medium">Tap to add photo</span>
          </button>
        )}

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
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
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
