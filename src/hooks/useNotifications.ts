import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notificationService, NotificationWithActor } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [data, count] = await Promise.all([
        notificationService.fetchNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await notificationService.markAllRead(user.id);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationService.markRead(id); } catch (e) { console.error(e); }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await notificationService.deleteNotification(id); } catch (e) { console.error(e); refresh(); }
  }, [refresh]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    setNotifications([]);
    setUnreadCount(0);
    try { await notificationService.clearAll(user.id); } catch (e) { console.error(e); refresh(); }
  }, [user, refresh]);

  useEffect(() => {
    refresh();
    if (!user) return;

    const channel = supabase
      .channel("notif-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh, user]);

  return { notifications, unreadCount, loading, refresh, markAllRead, markRead, dismiss, clearAll };
};
