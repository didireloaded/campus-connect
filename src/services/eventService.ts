import { supabase } from "@/integrations/supabase/client";

export interface EventRow {
  id: string;
  creator_id: string;
  university_id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  cover_image: string | null;
  attendees_count: number;
  verification_level: string | null;
  created_at: string;
}

export interface EventWithCreator extends EventRow {
  profiles: { username: string; avatar_url: string | null };
}

export const eventService = {
  async fetchEvents(limit = 50) {
    // Fetch both upcoming and recent past events (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("events")
      .select("*, profiles(username, avatar_url)")
      .gte("event_date", thirtyDaysAgo)
      .order("event_date", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as EventWithCreator[];
  },

  async createEvent(params: {
    creatorId: string;
    universityId: string;
    title: string;
    description?: string;
    eventDate: string;
    endDate?: string;
    locationName?: string;
    locationLat?: number;
    locationLng?: number;
    coverImage?: string;
  }) {
    const { error } = await supabase.from("events").insert({
      creator_id: params.creatorId,
      university_id: params.universityId,
      title: params.title,
      description: params.description || null,
      event_date: params.eventDate,
      end_date: params.endDate || null,
      location_name: params.locationName || null,
      location_lat: params.locationLat || null,
      location_lng: params.locationLng || null,
      cover_image: params.coverImage || null,
    });
    if (error) throw error;
  },

  async attend(eventId: string, userId: string) {
    const { error } = await supabase.from("event_attendees").insert({
      event_id: eventId,
      user_id: userId,
    });
    if (error && error.code === "23505") return false;
    if (error) throw error;
    return true;
  },

  async unattend(eventId: string, userId: string) {
    const { error } = await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", userId);
    if (error) throw error;
  },

  async getAttendedIds(userId: string) {
    const { data } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId);
    return new Set((data || []).map((d) => d.event_id));
  },

  async bookmarkEvent(eventId: string, userId: string) {
    const { error } = await supabase.from("event_bookmarks").insert({
      event_id: eventId,
      user_id: userId,
    });
    if (error?.code === "23505") return;
    if (error) throw error;
  },

  async unbookmarkEvent(eventId: string, userId: string) {
    const { error } = await supabase.from("event_bookmarks").delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async checkin(eventId: string, userId: string) {
    const { error } = await supabase.from("event_checkins").insert({
      event_id: eventId,
      user_id: userId,
    });
    if (error?.code === "23505") return;
    if (error) throw error;
  },
};
