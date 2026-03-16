import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, UserPlus, CalendarDays, Loader2, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null } | null;
}

const typeConfig: Record<string, { icon: typeof Heart; text: string; color: string }> = {
  like: { icon: Heart, text: "liked your post", color: "text-destructive" },
  comment: { icon: MessageCircle, text: "commented on your post", color: "text-primary" },
  follow: { icon: UserPlus, text: "started following you", color: "text-campus-green" },
  event_reminder: { icon: CalendarDays, text: "Event starting soon", color: "text-campus-orange" },
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, read, created_at, actor:profiles!notifications_actor_id_fkey(username, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as unknown as Notification[]);
    setLoading(false);

    // Mark as read
    if (data && data.length > 0) {
      const unreadIds = (data as any[]).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true } as any).in("id", unreadIds);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, user]);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
      </header>

      <div className="pb-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔔</p>
            <p className="font-semibold text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No new notifications</p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const config = typeConfig[n.type] || typeConfig.like;
            const Icon = config.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={n.actor?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {n.actor?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground">
                    <span className="font-semibold">{n.actor?.username || "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{config.text}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Icon size={18} className={`${config.color} shrink-0`} />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
