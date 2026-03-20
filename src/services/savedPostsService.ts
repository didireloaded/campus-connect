import { supabase } from "@/integrations/supabase/client";

export interface SavedPost {
  user_id: string;
  post_id: string;
  post_type: string;
  saved_at: string;
}

export const savedPostsService = {
  async getSavedPosts(userId: string) {
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });
    if (error) throw error;
    return (data || []) as SavedPost[];
  },

  async savePost(userId: string, postId: string, postType: string) {
    const { error } = await supabase.from("saved_posts").insert({
      user_id: userId,
      post_id: postId,
      post_type: postType,
    });
    if (error?.code === "23505") return; // already saved
    if (error) throw error;
  },

  async unsavePost(userId: string, postId: string) {
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);
    if (error) throw error;
  },

  async isSaved(userId: string, postId: string) {
    const { data } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();
    return !!data;
  },
};
