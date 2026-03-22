import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ShoppingBag, Package, Car, BookOpen, FileText, BarChart3, Ghost,
  Briefcase, Users, MapPin, Eye, Flame, Search, Newspaper, MessageCircle,
  Calendar, Home, TrendingUp, Box
} from "lucide-react";
import { Input } from "@/components/ui/input";

const GRID_ITEMS = [
  { label: "Events", subtitle: "What's happening", icon: Calendar, bg: "bg-brand-purple", text: "text-white", path: "/events" },
  { label: "Study Groups", subtitle: "Learn together", icon: BookOpen, bg: "bg-brand-orange", text: "text-white", path: "/study-groups" },
  { label: "Clubs", subtitle: "Join communities", icon: Users, bg: "bg-campus-green", text: "text-white", path: "/clubs" },
  { label: "Housing", subtitle: "Find a place", icon: Home, bg: "bg-primary", text: "text-white", path: "/housing" },
  { label: "Buy/Sell", subtitle: "Campus marketplace", icon: ShoppingBag, bg: "bg-feature-jobs", text: "text-white", path: "/marketplace" },
  { label: "Lost & Found", subtitle: "Find lost items", icon: Box, bg: "bg-destructive", text: "text-white", path: "/lost-found" },
  { label: "Lecture Notes", subtitle: "Share & find notes", icon: FileText, bg: "bg-feature-rides", text: "text-white", path: "/lecture-notes" },
  { label: "Jobs & Gigs", subtitle: "Campus opportunities", icon: Briefcase, bg: "bg-feature-notes", text: "text-white", path: "/jobs" },
  { label: "Ride Share", subtitle: "Carpool together", icon: Car, bg: "bg-feature-rides", text: "text-white", path: "/rides" },
  { label: "Campus Map", subtitle: "Navigate campus", icon: MapPin, bg: "bg-campus-green", text: "text-white", path: "/map" },
  { label: "Confessions", subtitle: "Anonymous secrets", icon: Ghost, bg: "bg-feature-confessions", text: "text-white", path: "/confessions" },
  { label: "Spotted", subtitle: "Campus sightings", icon: Eye, bg: "bg-feature-spotted", text: "text-white", path: "/spotted" },
  { label: "Polls", subtitle: "Vote & see results", icon: BarChart3, bg: "bg-feature-polls", text: "text-white", path: "/polls" },
  { label: "Campus Wall", subtitle: "Anonymous wall", icon: Flame, bg: "bg-feature-wall", text: "text-white", path: "/wall" },
  { label: "Updates", subtitle: "Official news", icon: Newspaper, bg: "bg-campus-blue", text: "text-white", path: "/campus-updates" },
  { label: "Messages", subtitle: "Direct messages", icon: MessageCircle, bg: "bg-brand-purple", text: "text-white", path: "/messages" },
];

const TRENDING_TAGS = [
  { tag: "#midterms", count: "1.2k" },
  { tag: "#party", count: "856" },
  { tag: "#housing", count: "432" },
  { tag: "#lostandfound", count: "215" },
  { tag: "#campusfood", count: "189" },
];

export default function Explore() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? GRID_ITEMS.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()))
    : GRID_ITEMS;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-20 glass px-4 py-4">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Discover</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Explore your campus</p>
        <div className="mt-4 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full h-11 bg-secondary border-0 text-sm font-medium"
          />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-8">
        {/* Category Grid */}
        <section>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center">
              <Box size={12} className="text-brand-purple" strokeWidth={3} />
            </div>
            Categories
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((item, i) => (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                className={`${item.bg} ${item.text} rounded-[2rem] p-5 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden group`}
              >
                <div className="absolute -right-4 -bottom-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                  <item.icon size={48} />
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm flex-shrink-0">
                  <item.icon size={28} />
                </div>
                <div className="mt-2">
                  <h2 className="text-lg font-black leading-tight">{item.label}</h2>
                  <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-wider">{item.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No results for "{search}"</p>
            </div>
          )}
        </section>

        {/* Trending */}
        <section>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center">
              <TrendingUp size={12} className="text-brand-orange" strokeWidth={3} />
            </div>
            Trending Now
          </h3>
          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            {TRENDING_TAGS.map((tag, i) => (
              <div key={i} className={`flex items-center justify-between p-4 hover:bg-secondary cursor-pointer transition-colors ${i !== TRENDING_TAGS.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-black text-sm">
                    {i + 1}
                  </div>
                  <span className="text-sm font-black text-foreground">{tag.tag}</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tag.count} posts</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
