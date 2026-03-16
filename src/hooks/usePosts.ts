import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { postService, PostWithProfile } from "@/services/postService";

export const usePosts = () => {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { posts, loading, refresh };
};
