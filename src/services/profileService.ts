import { supabase } from "@/integrations/supabase/client";

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    username?: string;
  }) {
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) throw error;
  },

  async getUniversity(universityId: string) {
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .eq("id", universityId)
      .single();
    if (error) throw error;
    return data;
  },

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return false;
    const { error } = await supabase.from("followers").insert({
      follower_id: followerId,
      following_id: followingId,
    });
    if (error && error.code === "23505") return false;
    if (error) throw error;
    return true;
  },

  async unfollow(followerId: string, followingId: string) {
    const { error } = await supabase.from("followers").delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  },

  async isFollowing(followerId: string, followingId: string) {
    const { data } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    return !!data;
  },

  async getFollowers(userId: string) {
    const { data } = await supabase
      .from("followers")
      .select("follower_id, profiles!followers_follower_id_fkey(username, avatar_url, full_name)")
      .eq("following_id", userId);
    return data || [];
  },

  async getFollowing(userId: string) {
    const { data } = await supabase
      .from("followers")
      .select("following_id, profiles!followers_following_id_fkey(username, avatar_url, full_name)")
      .eq("follower_id", userId);
    return data || [];
  },

  async uploadAvatar(userId: string, file: File) {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
    return urlData.publicUrl;
  },
};
