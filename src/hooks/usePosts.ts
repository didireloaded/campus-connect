import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { postService, PostWithProfile } from "@/services/postService";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Improved usePosts:
 *  - Scopes real-time subscription to the user's own university_id
 *    so we don't refetch on every post across the entire DB.
 *  - Debounces the refresh so rapid-fire changes (e.g. multiple likes)
 *    only trigger one network round-trip.
 *  - Exposes `optimisticUpdate` so callers can patch a post in-memory
 *    without a full refetch (e.g. after liking).
 */
export const usePosts = () => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await postService.fetchFeed(30);
      setPosts(data);
    } catch (e) {
      console.error("Failed to fetch posts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced refresh: waits 400ms after last event before hitting the DB
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(refresh, 400);
  }, [refresh]);

  // Optimistic in-memory patch — avoids a round-trip for simple count updates
  const optimisticUpdate = useCallback((postId: string, patch: Partial<PostWithProfile>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Only subscribe once we know the university_id so we can scope the filter
    const universityId = profile?.university_id;
    if (!universityId) return;

    const filter = `university_id=eq.${universityId}`;

    const channel = supabase
      .channel(`feed-${universityId}`)
      // posts.likes_count / comments_count are kept in sync by DB triggers,
      // so a single subscription on the posts table catches everything
      // without a flood of unrelated likes/comments events from other feeds.
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "posts",
        filter,
      }, debouncedRefresh)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [profile?.university_id, debouncedRefresh]);

  return { posts, loading, refresh, optimisticUpdate };
};
