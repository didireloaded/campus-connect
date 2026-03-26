import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Calendar, BookOpen, Users, Home, ShoppingBag, Box, FileText, Briefcase, Car, MapPin, Ghost, Eye, BarChart3, Flame, Newspaper, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const GRID_ITEMS = [
  { label: "Events", subtitle: "What's happening", icon: Calendar, path: "/events", featured: true },
  { label: "Study Groups", subtitle: "Learn together", icon: BookOpen, path: "/study-groups" },
  { label: "Clubs", subtitle: "Join communities", icon: Users, path: "/clubs" },
  { label: "Housing", subtitle: "Find a place", icon: Home, path: "/housing" },
  { label: "Buy/Sell", subtitle: "Campus marketplace", icon: ShoppingBag, path: "/marketplace" },
  { label: "Lost & Found", subtitle: "Find lost items", icon: Box, path: "/lost-found" },
  { label: "Lecture Notes", subtitle: "Share & find notes", icon: FileText, path: "/lecture-notes" },
  { label: "Jobs & Gigs", subtitle: "Campus opportunities", icon: Briefcase, path: "/jobs" },
  { label: "Ride Share", subtitle: "Carpool together", icon: Car, path: "/rides" },
  { label: "Campus Map", subtitle: "Navigate campus", icon: MapPin, path: "/map" },
  { label: "Confessions", subtitle: "Anonymous secrets", icon: Ghost, path: "/confessions" },
  { label: "Spotted", subtitle: "Campus sightings", icon: Eye, path: "/spotted" },
  { label: "Polls", subtitle: "Vote & see results", icon: BarChart3, path: "/polls" },
  { label: "Campus Wall", subtitle: "Anonymous wall", icon: Flame, path: "/wall", featured: true },
  { label: "Updates", subtitle: "Official news", icon: Newspaper, path: "/campus-updates" },
  { label: "Messages", subtitle: "Direct messages", icon: MessageCircle, path: "/messages" },
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
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Discover</h1>
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.09em] mt-1">Explore your campus</p>
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl h-10 bg-card border border-border text-sm font-medium placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3.5">
        {filtered.map((item, i) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
            className="bg-card border border-border rounded-[14px] p-3.5 flex flex-col gap-2.5 min-h-[80px] text-left hover:border-primary/30 transition-colors"
          >
            <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center ${
              item.featured ? "bg-primary/12 text-primary" : "bg-accent text-muted-foreground"
            }`}>
              <item.icon size={16} />
            </div>
            <div>
              <h2 className="text-[11px] font-bold text-foreground tracking-tight">{item.label}</h2>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{item.subtitle}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No results for "{search}"</p>
        </div>
      )}
    </div>
  );
}
