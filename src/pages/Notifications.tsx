import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, UserPlus, CalendarDays, Loader2 } from "lucide-react";
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

const typeIcon = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  event_reminder: CalendarDays,
};

const typeText: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  event_reminder: "Event starting soon",
};

export default function Notifications() {
  const { user } = useAuth();
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 border-b border-border">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Notifications</h1>
      </header>

      <div className="pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-20">No notifications yet</p>
        ) : (
          notifications.map((n, i) => {
            const Icon = typeIcon[n.type as keyof typeof typeIcon] || Heart;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-3 border-b border-border ${!n.read ? "bg-primary/5" : ""}`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={n.actor?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {n.actor?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{n.actor?.username || "Someone"}</span>{" "}
                    {typeText[n.type] || n.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Icon size={18} className="text-muted-foreground shrink-0" />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
