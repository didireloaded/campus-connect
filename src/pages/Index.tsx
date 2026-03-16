import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { useNotifications } from "@/hooks/useNotifications";
import { PostCard } from "@/components/feed/PostCard";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { Bell, Loader2, Compass, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { profileService } from "@/services/profileService";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, refresh } = usePosts();
  const { unreadCount } = useNotifications();
  const [uniName, setUniName] = useState("");

  useEffect(() => {
    if (profile?.university_id) {
      profileService.getUniversity(profile.university_id).then((uni) => {
        setUniName((uni as any).short_name || (uni as any).name || "Campus");
      }).catch(() => {});
    }
  }, [profile]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">{greeting()}</p>
              <h2 className="text-base font-bold text-foreground leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {profile?.full_name || profile?.username || "Student"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("/explore")}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-foreground hover:text-primary transition-colors"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-10 h-10 rounded-2xl glass flex items-center justify-center text-foreground hover:text-primary transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-glow">
                  <span className="text-[9px] font-bold text-primary-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Motivational tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-2xl font-extrabold text-foreground leading-tight"
        >
          Every Moment That
          <br />
          <span className="text-gradient">Truly Matters</span>
        </motion.h1>
      </header>

      {/* Stories */}
      <StoriesBar />

      {/* Feed */}
      <div className="px-4 pb-20 space-y-4 mt-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-6"
          >
            <p className="text-5xl mb-4">📸</p>
            <h3 className="text-xl font-bold text-foreground">Your campus feed is empty</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to post! Tap the + button to share what's happening.
            </p>
          </motion.div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <PostCard post={post} onUpdate={refresh} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
