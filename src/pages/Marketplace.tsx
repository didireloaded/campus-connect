import { useState } from "react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { CATEGORIES } from "@/services/marketplaceService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Tag, ShoppingBag, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { listings, loading } = useMarketplace(activeCategory);

  const filtered = searchQuery
    ? listings.filter((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : listings;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Shop-style header */}
      <header className="sticky top-0 z-40 glass px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-marketplace))]/15 flex items-center justify-center">
                <ShoppingBag size={14} className="text-[hsl(var(--feature-marketplace))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Marketplace</h1>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {["all", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-[hsl(var(--feature-marketplace))] text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 pb-20 pt-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[hsl(var(--feature-marketplace))]" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-marketplace))]/10 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={28} className="text-[hsl(var(--feature-marketplace))]" />
            </div>
            <p className="font-semibold text-foreground">No listings yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to sell something</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl overflow-hidden border border-border shadow-card group"
              >
                {/* Product image */}
                <div className="aspect-square bg-secondary relative overflow-hidden">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag size={28} className="text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Price tag overlay */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 rounded-lg bg-card/90 backdrop-blur-sm text-sm font-bold text-[hsl(var(--feature-marketplace))] shadow-sm">
                      N${listing.price.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Product info */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{listing.title}</p>
                  {listing.condition && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-secondary text-muted-foreground">
                      {listing.condition}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={listing.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-[7px] bg-secondary text-muted-foreground">
                        {listing.profiles?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground truncate">{listing.profiles?.username}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
