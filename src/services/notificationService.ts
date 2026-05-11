import { supabase } from "@/integrations/supabase/client";

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationWithActor extends NotificationRow {
  actor: { username: string; avatar_url: string | null } | null;
}

export const notificationService = {
  async fetchNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, read, created_at, actor_id, user_id, reference_id, actor:profiles!notifications_actor_id_fkey(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as NotificationWithActor[];
  },

  async markAllRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
  },

  async markRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("id", notificationId);
    if (error) throw error;
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
    if (error) throw error;
  },

  async clearAll(userId: string) {
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId);
    if (error) throw error;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
    return count || 0;
  },

  async createNotification(params: {
    userId: string;
    actorId: string;
    type: "like" | "comment" | "reply" | "follow" | "event_reminder" | "study_group_join" | "new_message";
    referenceId?: string;
  }) {
    if (params.userId === params.actorId) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      actor_id: params.actorId,
      type: params.type,
      reference_id: params.referenceId || null,
    } as any);
    if (error) throw error;
  },
};
