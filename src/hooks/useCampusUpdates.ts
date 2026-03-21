import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { campusUpdatesService, CampusUpdate } from "@/services/campusUpdatesService";
import { useAuth } from "@/contexts/AuthContext";

export const useCampusUpdates = () => {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<CampusUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await campusUpdatesService.fetchUpdates();
      setUpdates(data);
    } catch (e) {
      console.error("Failed to fetch campus updates:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("campus-updates-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "campus_updates" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "campus_alerts" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const markSeen = useCallback(async () => {
    if (!profile?.id) return;
    await campusUpdatesService.markRead(profile.id);
  }, [profile?.id]);

  return { updates, loading, refresh, markSeen };
};
