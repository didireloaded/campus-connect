import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { storyService, StoryGroup } from "@/services/storyService";

export const useStories = () => {
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await storyService.fetchStories();
      setStories(data);
    } catch (e) {
      console.error("Failed to fetch stories:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("stories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { stories, loading, refresh };
};
