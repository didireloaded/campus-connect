import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { wallService, WallPostRow } from "@/services/wallService";

export const useWallPosts = () => {
  const [posts, setPosts] = useState<WallPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await wallService.fetchPosts(30);
      setPosts(data);
    } catch (e) {
      console.error("Failed to fetch wall posts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("wall-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "wall_posts" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { posts, loading, refresh };
};
