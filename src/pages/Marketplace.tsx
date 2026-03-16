import { useState } from "react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { CATEGORIES } from "@/services/marketplaceService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Tag, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  textbooks: "📚 Books",
  electronics: "💻 Electronics",
  furniture: "🪑 Furniture",
  clothing: "👕 Clothing",
  services: "🛠 Services",
  roommate: "🏠 Roommate",
  other: "📦 Other",
};

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { listings, loading } = useMarketplace(activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBag size={22} className="text-primary" />
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Marketplace</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Buy & sell within your campus</p>
      </header>

      {/* Category chips */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🛒</p>
            <p className="font-semibold text-foreground">No listings yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to sell something on campus</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border"
              >
                <div className="aspect-square bg-secondary flex items-center justify-center">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Tag size={32} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-foreground line-clamp-1">{listing.title}</p>
                  <p className="text-base font-extrabold text-primary mt-0.5">N${listing.price.toFixed(0)}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={listing.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                        {listing.profiles?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground truncate">{listing.profiles?.username}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
