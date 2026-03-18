import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ShoppingBag, Package, Car, BookOpen, FileText, BarChart3, Ghost,
  Briefcase, Shield, MapPin, Eye, Flame, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

const sections = [
  {
    title: "Campus Life",
    items: [
      { path: "/confessions", icon: Ghost, label: "Confessions", desc: "Anonymous secrets", accent: "var(--feature-confessions)" },
      { path: "/spotted", icon: Eye, label: "Spotted", desc: "Campus moments", accent: "var(--feature-spotted)" },
      { path: "/polls", icon: BarChart3, label: "Polls", desc: "Vote on topics", accent: "var(--feature-polls)" },
      { path: "/wall", icon: Flame, label: "Campus Wall", desc: "Anonymous wall", accent: "var(--feature-wall)" },
    ],
  },
  {
    title: "Student Tools",
    items: [
      { path: "/marketplace", icon: ShoppingBag, label: "Marketplace", desc: "Buy & sell", accent: "var(--feature-marketplace)" },
      { path: "/lost-found", icon: Package, label: "Lost & Found", desc: "Report items", accent: "var(--feature-lostfound)" },
      { path: "/rides", icon: Car, label: "Ride Share", desc: "Share rides", accent: "var(--feature-rides)" },
      { path: "/map", icon: MapPin, label: "Campus Map", desc: "Find buildings", accent: "var(--feature-map)" },
    ],
  },
  {
    title: "Academic & Career",
    items: [
      { path: "/study-groups", icon: BookOpen, label: "Study Groups", desc: "Learn together", accent: "var(--feature-studygroups)" },
      { path: "/lecture-notes", icon: FileText, label: "Lecture Notes", desc: "Study materials", accent: "var(--feature-notes)" },
      { path: "/jobs", icon: Briefcase, label: "Jobs", desc: "Jobs & internships", accent: "var(--feature-jobs)" },
      { path: "/clubs", icon: Shield, label: "Clubs", desc: "Organizations", accent: "var(--feature-clubs)" },
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
      <header className="sticky top-0 z-40 glass px-5 py-3.5">
        <h1 className="text-lg font-bold text-foreground">Discover</h1>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">Your campus toolkit</p>
        <div className="relative mt-2.5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-9 text-sm bg-secondary border-0"
          />
        </div>
      </header>

      {filtered ? (
        <div className="grid grid-cols-2 gap-2.5 p-4 pb-24">
          {filtered.map((f, i) => (
            <ToolCard key={f.path} f={f} i={i} navigate={navigate} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground text-sm">No tools match "{search}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="pb-24 space-y-5 mt-3">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="px-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{section.title}</h2>
              <div className="grid grid-cols-2 gap-2.5 px-4">
                {section.items.map((f, i) => (
                  <ToolCard key={f.path} f={f} i={i} navigate={navigate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCard({ f, i, navigate }: { f: any; i: number; navigate: any }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03, duration: 0.2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(f.path)}
      className="bg-card rounded-xl p-3.5 text-left flex items-start gap-3 border border-border shadow-card hover:shadow-elevated transition-shadow"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `hsl(${f.accent} / 0.12)` }}
      >
        <f.icon size={17} style={{ color: `hsl(${f.accent})` }} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">{f.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
      </div>
    </motion.button>
  );
}
