import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { useEvents } from "@/hooks/useEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { PostCard } from "@/components/feed/PostCard";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { Bell, Loader2, Search, CalendarDays, MapPin, ChevronRight, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUniConfig } from "@/config/universities";
import { formatDistanceToNow } from "date-fns";

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, refresh } = usePosts();
  const { events } = useEvents();
  const { unreadCount } = useNotifications();
  const [uniShortName, setUniShortName] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.university_id) {
      profileService.getUniversity(profile.university_id).then((uni) => {
        setUniShortName((uni as any).short_name || null);
      }).catch(() => {});

      supabase.from("trending_topics")
        .select("*")
        .eq("university_id", profile.university_id)
        .order("post_count", { ascending: false })
        .limit(4)
        .then(({ data }) => setTrendingTopics(data || []));
    }
  }, [profile]);

  const uniConfig = getUniConfig(uniShortName);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date())
    .slice(0, 3);

  const recentPosts = posts.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{greeting()}</p>
              <h2 className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
                {uniShortName && (
                  <img src={uniConfig.logo} alt={uniConfig.shortName} className="w-4 h-4 object-contain" />
                )}
                {uniShortName ? `${uniConfig.shortName} Hub` : (profile?.full_name || "Campus")}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/explore")}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <StoriesBar />

      {/* Dashboard sections */}
      <div className="px-4 pb-24 space-y-5 mt-3">

        {/* Trending Now */}
        {trendingTopics.length > 0 && (
          <DashboardSection title="Trending Now" icon={<TrendingUp size={14} />}>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {trendingTopics.map((t) => (
                <div key={t.id} className="shrink-0 bg-card rounded-xl px-3.5 py-2.5 border border-border shadow-card">
                  <p className="text-xs font-semibold text-foreground">#{t.topic}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.post_count} posts</p>
                </div>
              ))}
            </div>
          </DashboardSection>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <DashboardSection
            title="Upcoming Events"
            icon={<CalendarDays size={14} />}
            action={{ label: "View all", onClick: () => navigate("/events") }}
          >
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <motion.button
                  key={ev.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="w-full bg-card rounded-xl p-3.5 border border-border shadow-card flex items-start gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(ev.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      {ev.location_name && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin size={9} /> {ev.location_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold shrink-0">
                    {ev.attendees_count || 0} going
                  </span>
                </motion.button>
              ))}
            </div>
          </DashboardSection>
        )}

        {/* Recent Activity */}
        <DashboardSection
          title="Recent Activity"
          icon={<Zap size={14} />}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={22} />
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-3xl mb-2">📋</p>
              <h3 className="text-sm font-semibold text-foreground">No activity yet</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to share something on campus
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <PostCard post={post} onUpdate={refresh} />
                </motion.div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
        </div>
        {action && (
          <button onClick={action.onClick} className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
            {action.label} <ChevronRight size={12} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
