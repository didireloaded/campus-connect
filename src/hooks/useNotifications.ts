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
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
    try { await notificationService.markRead(id); } catch (e) { console.error(e); }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
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

    const fetchActor = async (actorId: string | null) => {
      if (!actorId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", actorId)
        .maybeSingle();
      return data ?? null;
    };

    const channel = supabase
      .channel(`notif-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const row = payload.new as NotificationWithActor;
          // Avoid duplicates if already present
          let exists = false;
          setNotifications((prev) => {
            exists = prev.some((n) => n.id === row.id);
            return prev;
          });
          if (exists) return;
          const actor = await fetchActor(row.actor_id);
          setNotifications((prev) =>
            prev.some((n) => n.id === row.id) ? prev : [{ ...row, actor }, ...prev]
          );
          if (!row.read) setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as NotificationWithActor;
          const old = payload.old as Partial<NotificationWithActor>;
          setNotifications((prev) =>
            prev.map((n) => (n.id === row.id ? { ...n, ...row, actor: n.actor } : n))
          );
          if (old.read === false && row.read === true) {
            setUnreadCount((c) => Math.max(0, c - 1));
          } else if (old.read === true && row.read === false) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const oldRow = payload.old as Partial<NotificationWithActor>;
          if (!oldRow.id) return;
          setNotifications((prev) => {
            const target = prev.find((n) => n.id === oldRow.id);
            if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
            return prev.filter((n) => n.id !== oldRow.id);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh, user]);

  return { notifications, unreadCount, loading, refresh, markAllRead, markRead, dismiss, clearAll };
};
