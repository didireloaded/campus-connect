import { supabase } from "@/integrations/supabase/client";
import { sortByFeedScore, filterByAge } from "./algorithmService";

export interface PostRow {
  id: string;
  user_id: string;
  university_id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface PostWithProfile extends PostRow {
  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export const postService = {
  async fetchFeed(limit = 30) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("university_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.university_id) return [];

    // Fetch more than needed, score client-side, then slice
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url, full_name)")
      .eq("university_id", profile.university_id)
      .eq("moderation_status", "approved")
      .gte("created_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    if (error) throw error;
    const posts = (data || []) as unknown as PostWithProfile[];
    return sortByFeedScore(posts).slice(0, limit);
  },

  async fetchUserPosts(userId: string) {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url, full_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as PostWithProfile[];
  },

  async createPost(params: { userId: string; universityId: string; content: string; imageUrl?: string }) {
    const { data: post, error } = await supabase.from("posts").insert({
      user_id: params.userId,
      university_id: params.universityId,
      content: params.content,
      image_url: params.imageUrl || null,
    }).select("id").single();
    if (error) throw error;

    // Trigger AI moderation in background
    if (post && params.content) {
      supabase.functions.invoke("moderate-content", {
        body: { content: params.content, content_type: "post", content_id: post.id },
      }).catch((err) => console.error("Moderation call failed:", err));
    }
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  async likePost(postId: string, userId: string) {
    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    if (error && error.code === "23505") return false;
    if (error) throw error;
    return true;
  },

  async unlikePost(postId: string, userId: string) {
    const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  },

  async isLiked(postId: string, userId: string) {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    return !!data;
  },

  async fetchComments(postId: string) {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createComment(postId: string, userId: string, content: string) {
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      content,
    });
    if (error) throw error;
  },

  // Real-time subscription scoped to university
  subscribeToFeed(universityId: string, onNewPost: (post: any) => void) {
    return supabase
      .channel(`feed-${universityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `university_id=eq.${universityId}`,
        },
        (payload) => onNewPost(payload.new)
      )
      .subscribe();
  },
};
