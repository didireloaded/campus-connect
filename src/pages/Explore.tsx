import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, Car, BookOpen, FileText, BarChart3, Ghost,
  Briefcase, Shield, ShoppingBag, MapPin
} from "lucide-react";

const features = [
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace", desc: "Buy & sell on campus", gradient: "from-primary/20 to-primary/5" },
  { path: "/lost-found", icon: Package, label: "Lost & Found", desc: "Report lost or found items", gradient: "from-orange-400/20 to-orange-400/5" },
  { path: "/rides", icon: Car, label: "Ride Share", desc: "Share rides with students", gradient: "from-emerald-500/20 to-emerald-500/5" },
  { path: "/study-groups", icon: BookOpen, label: "Study Groups", desc: "Find study partners", gradient: "from-blue-500/20 to-blue-500/5" },
  { path: "/lecture-notes", icon: FileText, label: "Lecture Notes", desc: "Share study materials", gradient: "from-violet-500/20 to-violet-500/5" },
  { path: "/polls", icon: BarChart3, label: "Campus Polls", desc: "Vote on campus topics", gradient: "from-pink-500/20 to-pink-500/5" },
  { path: "/confessions", icon: Ghost, label: "Confessions", desc: "Anonymous confessions", gradient: "from-purple-500/20 to-purple-500/5" },
  { path: "/jobs", icon: Briefcase, label: "Job Board", desc: "Jobs & internships", gradient: "from-amber-500/20 to-amber-500/5" },
  { path: "/clubs", icon: Shield, label: "Clubs", desc: "Student organizations", gradient: "from-teal-500/20 to-teal-500/5" },
  { path: "/map", icon: MapPin, label: "Campus Map", desc: "Events around campus", gradient: "from-red-500/20 to-red-500/5" },
];

export default function Explore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-5 py-4">
        <h1 className="text-2xl font-extrabold text-foreground">Discover</h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Everything your campus offers</p>
      </header>

      <div className="grid grid-cols-2 gap-3 p-4 pb-24">
        {features.map((f, i) => (
          <motion.button
            key={f.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(f.path)}
            className={`bg-gradient-to-br ${f.gradient} rounded-2xl p-4 text-left flex flex-col gap-3 border border-border/50 hover:shadow-elevated transition-shadow`}
          >
            <div className="w-11 h-11 rounded-2xl bg-background/80 flex items-center justify-center shadow-card">
              <f.icon size={20} className="text-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
