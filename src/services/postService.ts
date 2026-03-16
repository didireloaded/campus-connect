import { supabase } from "@/integrations/supabase/client";

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
    // Use ranked feed - get user's university_id first
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).maybeSingle();
      if (profile?.university_id) {
        const { data: ranked, error: rpcError } = await supabase.rpc("get_ranked_feed", {
          p_university_id: profile.university_id,
          p_limit: limit,
          p_offset: 0,
        });
        if (!rpcError && ranked && ranked.length > 0) {
          // Fetch profiles for ranked posts
          const ids = ranked.map((p: any) => p.id);
          const { data: withProfiles } = await supabase
            .from("posts")
            .select("*, profiles(username, avatar_url, full_name)")
            .in("id", ids);
          if (withProfiles) {
            // Re-sort by ranked order
            const idOrder = new Map(ids.map((id: string, i: number) => [id, i]));
            const sorted = [...withProfiles].sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
            return sorted as unknown as PostWithProfile[];
          }
        }
      }
    }
    // Fallback to chronological
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url, full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as PostWithProfile[];
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
    const { error } = await supabase.from("posts").insert({
      user_id: params.userId,
      university_id: params.universityId,
      content: params.content,
      image_url: params.imageUrl || null,
    });
    if (error) throw error;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  async likePost(postId: string, userId: string) {
    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    if (error && error.code === "23505") return false; // already liked
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
};
