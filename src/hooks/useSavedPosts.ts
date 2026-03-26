import { useEffect, useState, useCallback } from "react";
import { savedPostsService, SavedPost } from "@/services/savedPostsService";
import { useAuth } from "@/contexts/AuthContext";

export const useSavedPosts = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await savedPostsService.getSavedPosts(user.id);
      setSaved(data);
    } catch (e) {
      console.error("Failed to fetch saved posts:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isSaved = useCallback((postId: string) => {
    return saved.some((s) => s.post_id === postId);
  }, [saved]);

  const toggleSave = useCallback(async (postId: string, postType: string) => {
    if (!user) return false;
    const alreadySaved = saved.some((s) => s.post_id === postId);
    if (alreadySaved) {
      await savedPostsService.unsavePost(user.id, postId);
    } else {
      await savedPostsService.savePost(user.id, postId, postType);
    }
    refresh();
    return !alreadySaved;
  }, [user, saved, refresh]);

  return { saved, loading, refresh, toggleSave, isSaved };
};
