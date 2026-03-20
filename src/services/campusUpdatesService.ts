import { supabase } from "@/integrations/supabase/client";

export interface CampusUpdate {
  id: string;
  university_id: string;
  title: string;
  content: string | null;
  source: string | null;
  source_type: string | null;
  source_url: string | null;
  image_url: string | null;
  created_at: string | null;
  inserted_at: string;
}

export const campusUpdatesService = {
  async fetchUpdates(filter = 'all', limit = 40) {
    let query = supabase
      .from("campus_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter !== 'all') query = query.eq("source_type", filter);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CampusUpdate[];
  },

  async getUnreadCount(userId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_updates_seen_at")
      .eq("id", userId)
      .single();

    if (!profile?.last_updates_seen_at) return 0;

    const { count } = await supabase
      .from("campus_updates")
      .select("id", { count: "exact", head: true })
      .gt("created_at", profile.last_updates_seen_at);

    return count || 0;
  },

  async markRead(userId: string) {
    await supabase
      .from("profiles")
      .update({ last_updates_seen_at: new Date().toISOString() } as any)
      .eq("id", userId);
  },
};
