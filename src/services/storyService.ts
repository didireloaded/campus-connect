import { supabase } from "@/integrations/supabase/client";

export interface StoryRow {
  id: string;
  user_id: string;
  university_id: string;
  media_url: string;
  story_type: string;
  expires_at: string;
  created_at: string;
}

export interface StoryGroup {
  user_id: string;
  username: string;
  avatar_url: string | null;
  stories: StoryRow[];
}

export const storyService = {
  async fetchStories() {
    const { data, error } = await supabase
      .from("stories")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Group by user
    const grouped = new Map<string, StoryGroup>();
    for (const s of (data || []) as any[]) {
      if (!grouped.has(s.user_id)) {
        grouped.set(s.user_id, {
          user_id: s.user_id,
          username: s.profiles?.username || "user",
          avatar_url: s.profiles?.avatar_url,
          stories: [],
        });
      }
      grouped.get(s.user_id)!.stories.push(s);
    }
    return Array.from(grouped.values());
  },

  async createStory(userId: string, universityId: string, mediaUrl: string, type: "friend" | "event" = "friend") {
    const { error } = await supabase.from("stories").insert({
      user_id: userId,
      university_id: universityId,
      media_url: mediaUrl,
      story_type: type,
    } as any);
    if (error) throw error;
  },

  async deleteStory(storyId: string) {
    const { error } = await supabase.from("stories").delete().eq("id", storyId);
    if (error) throw error;
  },
};
