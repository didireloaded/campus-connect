import { supabase } from "@/integrations/supabase/client";

export interface WallPostRow {
  id: string;
  university_id: string;
  content: string;
  alias: string | null;
  upvotes: number;
  created_at: string;
}

const GHOST_NAMES = [
  "GhostFox", "MidnightLion", "CampusGhost", "ShadowOwl", "NightWolf",
  "PhantomEagle", "SilentViper", "MysticRaven", "HiddenPanther", "StealthHawk",
  "NightOwl", "CoffeeAddict", "DarkFalcon", "CryptoLynx", "SilverFox",
  "IronMoth", "BlueHeron", "LostPenguin", "QuietStorm", "EmberCat",
];

export const generateAlias = () => {
  const name = GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${name}${num}`;
};

export const wallService = {
  async fetchPosts(limit = 30) {
    const { data, error } = await supabase
      .from("wall_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as WallPostRow[];
  },

  async createPost(universityId: string, content: string) {
    const alias = generateAlias();
    const { data: post, error } = await supabase.from("wall_posts").insert({
      university_id: universityId,
      content,
      alias,
    } as any).select("id").single();
    if (error) throw error;

    // Trigger AI moderation in background
    if (post) {
      supabase.functions.invoke("moderate-content", {
        body: { content, content_type: "wall_post", content_id: post.id },
      }).catch((err) => console.error("Moderation call failed:", err));
    }
  },

  async upvote(wallPostId: string, userId: string) {
    const { error } = await supabase.from("wall_upvotes").insert({
      wall_post_id: wallPostId,
      user_id: userId,
    });
    if (error && error.code === "23505") {
      // Already upvoted — remove
      await supabase.from("wall_upvotes").delete().eq("wall_post_id", wallPostId).eq("user_id", userId);
      return false;
    }
    if (error) throw error;
    return true;
  },

  async report(reporterId: string, wallPostId: string, reason: string) {
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      content_type: "wall_post",
      content_id: wallPostId,
      reason,
    } as any);
    if (error) throw error;
  },
};
