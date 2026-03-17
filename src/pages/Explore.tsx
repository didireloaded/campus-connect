import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ShoppingBag, Package, Car, BookOpen, FileText, BarChart3, Ghost,
  Briefcase, Shield, MapPin, Eye, Flame, Search, Megaphone
} from "lucide-react";
import { Input } from "@/components/ui/input";

const sections = [
  {
    title: "Campus Life",
    items: [
      { path: "/confessions", icon: Ghost, label: "Confessions", desc: "Anonymous secrets", color: "from-purple-500/20 to-purple-500/5" },
      { path: "/spotted", icon: Eye, label: "Spotted", desc: "Campus moments", color: "from-pink-500/20 to-pink-500/5" },
      { path: "/polls", icon: BarChart3, label: "Polls", desc: "Vote on topics", color: "from-blue-500/20 to-blue-500/5" },
      { path: "/wall", icon: Flame, label: "Campus Wall", desc: "Anonymous wall", color: "from-orange-400/20 to-orange-400/5" },
    ],
  },
  {
    title: "Student Tools",
    items: [
      { path: "/marketplace", icon: ShoppingBag, label: "Marketplace", desc: "Buy & sell", color: "from-primary/20 to-primary/5" },
      { path: "/lost-found", icon: Package, label: "Lost & Found", desc: "Report items", color: "from-amber-500/20 to-amber-500/5" },
      { path: "/rides", icon: Car, label: "Ride Share", desc: "Share rides", color: "from-emerald-500/20 to-emerald-500/5" },
      { path: "/map", icon: MapPin, label: "Campus Map", desc: "Find buildings", color: "from-red-500/20 to-red-500/5" },
    ],
  },
  {
    title: "Academic & Career",
    items: [
      { path: "/study-groups", icon: BookOpen, label: "Study Groups", desc: "Learn together", color: "from-blue-500/20 to-blue-500/5" },
      { path: "/lecture-notes", icon: FileText, label: "Lecture Notes", desc: "Study materials", color: "from-violet-500/20 to-violet-500/5" },
      { path: "/jobs", icon: Briefcase, label: "Jobs", desc: "Jobs & internships", color: "from-amber-500/20 to-amber-500/5" },
      { path: "/clubs", icon: Shield, label: "Clubs", desc: "Organizations", color: "from-teal-500/20 to-teal-500/5" },
    ],
  },
];

export default function Explore() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const allItems = sections.flatMap((s) => s.items);
  const filtered = search.trim()
    ? allItems.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-5 py-4">
        <h1 className="text-2xl font-extrabold text-foreground">Discover</h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Everything your campus offers</p>
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-10 text-sm"
          />
        </div>
      </header>

      {filtered ? (
        <div className="grid grid-cols-2 gap-3 p-4 pb-24">
          {filtered.map((f, i) => (
            <FeatureCard key={f.path} f={f} i={i} navigate={navigate} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground text-sm">No features match "{search}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="pb-24">
          {sections.map((section) => (
            <div key={section.title} className="mt-4">
              <h2 className="px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{section.title}</h2>
              <div className="grid grid-cols-2 gap-3 px-4">
                {section.items.map((f, i) => (
                  <FeatureCard key={f.path} f={f} i={i} navigate={navigate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ f, i, navigate }: { f: any; i: number; navigate: any }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => navigate(f.path)}
      className={`bg-gradient-to-br ${f.color} rounded-2xl p-4 text-left flex flex-col gap-3 border border-border/50 hover:shadow-elevated transition-shadow`}
    >
      <div className="w-11 h-11 rounded-2xl bg-background/80 flex items-center justify-center shadow-card">
        <f.icon size={20} className="text-foreground" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{f.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
      </div>
    </motion.button>
  );
}
