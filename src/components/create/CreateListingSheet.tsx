import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService, CATEGORIES } from "@/services/marketplaceService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  textbooks: "📚 Books",
  electronics: "💻 Electronics",
  furniture: "🪑 Furniture",
  clothing: "👕 Clothing",
  services: "🛠 Services",
  roommate: "🏠 Roommate",
  other: "📦 Other",
};

export const CreateListingSheet = ({ open, onOpenChange }: CreateListingSheetProps) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !price || !user || !profile?.university_id) return;
    setLoading(true);
    try {
      await marketplaceService.createListing({
        sellerId: user.id,
        universityId: profile.university_id,
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        category,
      });
      toast.success("Listed! 🛒");
      setTitle(""); setDescription(""); setPrice(""); setCategory("other");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-foreground">Sell Something</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <Input placeholder="What are you selling?" value={title} onChange={(e) => setTitle(e.target.value)} className="text-foreground" />
          <Input placeholder="Price (N$)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="text-foreground" />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="text-foreground" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>{CATEGORY_LABELS[cat] || cat}</button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading || !title.trim() || !price}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "List Item"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
