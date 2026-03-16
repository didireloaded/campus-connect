import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { eventService, EventWithCreator } from "@/services/eventService";
import { useAuth } from "@/contexts/AuthContext";

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithCreator[]>([]);
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await eventService.fetchEvents();
      setEvents(data);
      if (user) {
        const ids = await eventService.getAttendedIds(user.id);
        setAttendedIds(ids);
      }
    } catch (e) {
      console.error("Failed to fetch events:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "event_attendees" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { events, attendedIds, loading, refresh };
};
