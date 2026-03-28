import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { useEvents } from "@/hooks/useEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { PostCard } from "@/components/feed/PostCard";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { Bell, Loader2, Search, CalendarDays, MapPin, ChevronRight, TrendingUp, Zap, MessageCircle, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUniConfig } from "@/config/universities";
import { formatDistanceToNow } from "date-fns";
import { useCampusUpdates } from "@/hooks/useCampusUpdates";

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, refresh } = usePosts();
  const { events } = useEvents();
  const { unreadCount } = useNotifications();
  const [uniShortName, setUniShortName] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const { updates } = useCampusUpdates();

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
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-[33px] w-[33px] border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-accent text-primary text-[11px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.09em]">{greeting()}</p>
              <h2 className="text-[13px] font-bold text-foreground leading-tight tracking-tight">
                {uniShortName ? `${uniConfig.shortName} Hub` : (profile?.full_name || "Campus")}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/messages")}
              className="w-8 h-8 rounded-[10px] bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle size={14} />
            </button>
            <button
              onClick={() => navigate("/discover")}
              className="w-8 h-8 rounded-[10px] bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search size={14} />
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-8 h-8 rounded-[10px] bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[13px] h-[13px] bg-destructive rounded-full flex items-center justify-center border-[1.5px] border-background">
                  <span className="text-[7px] font-bold text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
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

        {/* Campus Updates preview */}
        {updates.length > 0 && (
          <DashboardSection
            title="Campus Updates"
            icon={<Newspaper size={14} />}
            action={{ label: "View all", onClick: () => navigate("/campus-updates") }}
          >
            <div className="space-y-2">
              {updates.slice(0, 2).map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate("/campus-updates")}
                  className="w-full bg-card rounded-xl p-3.5 border border-border shadow-card flex items-start gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Newspaper size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.title}</p>
                    {u.content && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{u.content}</p>
                    )}
                  </div>
                </button>
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

        {/* Quick Actions — always visible */}
        <DashboardSection title="Quick Actions" icon={<Zap size={14} />}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Events", icon: <CalendarDays size={18} />, path: "/events" },
              { label: "Market", icon: <Search size={18} />, path: "/marketplace" },
              { label: "Groups", icon: <MessageCircle size={18} />, path: "/study-groups" },
              { label: "Wall", icon: <TrendingUp size={18} />, path: "/wall" },
            ].map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 py-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="text-primary">{item.icon}</div>
                <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </DashboardSection>

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
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No activity yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                Be the first to share something on your campus!
              </p>
              <button
                onClick={() => navigate("/discover")}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
              >
                Explore Campus
              </button>
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
