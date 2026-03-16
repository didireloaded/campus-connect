import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, Car, BookOpen, FileText, BarChart3, Ghost,
  Briefcase, Shield, ShoppingBag, MapPin, ArrowLeft
} from "lucide-react";

const features = [
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace", desc: "Buy & sell on campus", color: "bg-primary/10 text-primary" },
  { path: "/lost-found", icon: Package, label: "Lost & Found", desc: "Report lost or found items", color: "bg-orange-500/10 text-orange-500" },
  { path: "/rides", icon: Car, label: "Ride Share", desc: "Share rides with students", color: "bg-emerald-500/10 text-emerald-500" },
  { path: "/study-groups", icon: BookOpen, label: "Study Groups", desc: "Find study partners", color: "bg-blue-500/10 text-blue-500" },
  { path: "/lecture-notes", icon: FileText, label: "Lecture Notes", desc: "Share study materials", color: "bg-violet-500/10 text-violet-500" },
  { path: "/polls", icon: BarChart3, label: "Campus Polls", desc: "Vote on campus topics", color: "bg-pink-500/10 text-pink-500" },
  { path: "/confessions", icon: Ghost, label: "Confessions", desc: "Anonymous confessions", color: "bg-purple-500/10 text-purple-500" },
  { path: "/jobs", icon: Briefcase, label: "Job Board", desc: "Jobs & internships", color: "bg-amber-500/10 text-amber-500" },
  { path: "/clubs", icon: Shield, label: "Clubs", desc: "Student organizations", color: "bg-teal-500/10 text-teal-500" },
  { path: "/map", icon: MapPin, label: "Campus Map", desc: "Events around campus", color: "bg-red-500/10 text-red-500" },
];

export default function Explore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 border-b border-border">
        <h1 className="text-xl font-extrabold text-foreground">Explore</h1>
        <p className="text-[10px] text-muted-foreground">Everything your campus offers</p>
      </header>

      <div className="grid grid-cols-2 gap-3 p-4 pb-20">
        {features.map((f, i) => (
          <motion.button
            key={f.path}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(f.path)}
            className="bg-card rounded-xl p-4 border border-border text-left flex flex-col gap-2"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
              <f.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
