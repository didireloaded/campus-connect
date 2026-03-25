import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { label: 'Events', sub: "What's happening", path: '/events', emoji: '🎤', accent: '#7C5CBF', pattern: 'circles', size: 'tall' },
  { label: 'Study Groups', sub: 'Learn together', path: '/study-groups', emoji: '📚', accent: '#2D6A4F', pattern: 'grid', size: 'normal' },
  { label: 'Housing', sub: 'Find a place', path: '/housing', emoji: '🏠', accent: '#1B4F72', pattern: 'dots', size: 'normal' },
  { label: 'Buy & Sell', sub: 'Marketplace', path: '/marketplace', emoji: '🛍️', accent: '#7D4E24', pattern: 'lines', size: 'tall' },
  { label: 'Lost & Found', sub: 'Recover items', path: '/lost-found', emoji: '🔍', accent: '#922B21', pattern: 'noise', size: 'normal' },
  { label: 'Lecture Notes', sub: 'Share knowledge', path: '/lecture-notes', emoji: '📄', accent: '#145A7C', pattern: 'lines', size: 'normal' },
  { label: 'Jobs & Gigs', sub: 'Opportunities', path: '/jobs', emoji: '💼', accent: '#1E5631', pattern: 'grid', size: 'wide' },
  { label: 'Ride Share', sub: 'Travel together', path: '/rides', emoji: '🚗', accent: '#0E4B4B', pattern: 'circles', size: 'normal' },
  { label: 'Confessions', sub: 'Say it anonymously', path: '/confessions', emoji: '👻', accent: '#4A235A', pattern: 'noise', size: 'normal' },
  { label: 'Spotted', sub: 'Campus sightings', path: '/spotted', emoji: '👀', accent: '#7D5A00', pattern: 'dots', size: 'normal' },
  { label: 'Polls', sub: 'Vote on things', path: '/polls', emoji: '📊', accent: '#1A5276', pattern: 'lines', size: 'normal' },
  { label: 'Campus Wall', sub: 'Anonymous posts', path: '/wall', emoji: '🔥', accent: '#7B241C', pattern: 'noise', size: 'wide' },
  { label: 'Clubs', sub: 'Join communities', path: '/clubs', emoji: '🎭', accent: '#1B4F72', pattern: 'circles', size: 'normal' },
  { label: 'Campus Map', sub: 'Navigate campus', path: '/map', emoji: '📍', accent: '#1E5631', pattern: 'grid', size: 'normal' },
  { label: 'Updates', sub: 'Official news', path: '/campus-updates', emoji: '📰', accent: '#1A3B5C', pattern: 'dots', size: 'tall' },
  { label: 'Messages', sub: 'Direct messages', path: '/messages', emoji: '💬', accent: '#4A235A', pattern: 'circles', size: 'normal' },
];

const TRENDING = ['#midterms', '#housing', '#nustlife', '#party', '#lostandfound'];

function PatternSVG({ type, accent }: { type: string; accent: string }) {
  if (type === 'circles') return (
    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80%" cy="20%" r="40" fill="none" stroke={accent} strokeWidth="20" />
      <circle cx="90%" cy="80%" r="25" fill="none" stroke={accent} strokeWidth="14" />
      <circle cx="10%" cy="70%" r="18" fill="none" stroke={accent} strokeWidth="10" />
    </svg>
  );
  if (type === 'grid') return (
    <svg className="absolute inset-0 w-full h-full opacity-8" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={`g-${accent}`} width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke={accent} strokeWidth="0.5"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill={`url(#g-${accent})`} />
    </svg>
  );
  if (type === 'dots') return (
    <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={`d-${accent}`} width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill={accent} />
      </pattern></defs>
      <rect width="100%" height="100%" fill={`url(#d-${accent})`} />
    </svg>
  );
  if (type === 'lines') return (
    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={`l-${accent}`} width="20" height="20" patternUnits="userSpaceOnUse">
        <line x1="0" y1="20" x2="20" y2="0" stroke={accent} strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill={`url(#l-${accent})`} />
    </svg>
  );
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="85%" cy="15%" rx="30" ry="20" fill={accent} opacity="0.4" />
      <ellipse cx="15%" cy="85%" rx="25" ry="18" fill={accent} opacity="0.3" />
      <ellipse cx="60%" cy="60%" rx="35" ry="25" fill={accent} opacity="0.2" />
    </svg>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 glass px-4 pt-4 pb-3 border-b border-border">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Discover</h1>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          Explore your campus
        </p>
        <div className="mt-3 flex items-center gap-3 bg-secondary rounded-xl px-3 py-2.5">
          <Search size={15} className="text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search features..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
          />
        </div>

        {!search && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
            <div className="flex items-center gap-1 flex-shrink-0 text-[10px] font-bold text-muted-foreground">
              <TrendingUp size={11} /> Trending:
            </div>
            {TRENDING.map(tag => (
              <button key={tag} className="flex-shrink-0 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 pb-28">
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((cat, i) => (
            <motion.button
              key={cat.path}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(cat.path)}
              className="relative rounded-2xl overflow-hidden text-left"
              style={{
                gridColumn: cat.size === 'wide' ? 'span 2' : 'span 1',
                minHeight: cat.size === 'tall' ? '140px' : cat.size === 'wide' ? '90px' : '120px',
                background: cat.accent + '22',
                border: `1px solid ${cat.accent}33`,
              }}
            >
              <PatternSVG type={cat.pattern} accent={cat.accent} />
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30"
                style={{ background: cat.accent, transform: 'translate(30%,-30%)' }}
              />
              <div className="relative z-10 p-4 flex flex-col h-full justify-between">
                <div><span className="text-2xl leading-none">{cat.emoji}</span></div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-foreground leading-tight">{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{cat.sub}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60" style={{ background: cat.accent }} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
  Calendar, Home, Box
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
