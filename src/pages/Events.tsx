import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, Users, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format, isPast } from "date-fns";

interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location_name: string | null;
  cover_image: string | null;
  attendees_count: number;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
}

export default function Events() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("*, profiles(username, avatar_url)")
      .order("event_date", { ascending: true })
      .limit(50);
    if (data) setEvents(data as unknown as CampusEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    // Check which events user is attending
    if (user) {
      supabase
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) setAttendedIds(new Set(data.map((d) => d.event_id)));
        });
    }
  }, [fetchEvents, user]);

  const handleAttend = async (eventId: string) => {
    if (!user) return;
    const isAttending = attendedIds.has(eventId);

    if (isAttending) {
      await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
      setAttendedIds((prev) => { const n = new Set(prev); n.delete(eventId); return n; });
      toast.info("Removed from event");
    } else {
      const { error } = await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
      if (error) { toast.error("Failed to RSVP"); return; }
      setAttendedIds((prev) => new Set(prev).add(eventId));
      toast.success("You're attending! 🎉");
    }
    fetchEvents();
  };

  const upcomingEvents = events.filter((e) => !isPast(new Date(e.event_date)));
  const pastEvents = events.filter((e) => isPast(new Date(e.event_date)));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Events</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">What's happening on campus</p>
      </header>

      <div className="px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🗓️</p>
            <p className="font-semibold text-foreground">No events yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to create the first campus event</p>
          </div>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Upcoming</p>
                {upcomingEvents.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    isAttending={attendedIds.has(event.id)}
                    onAttend={() => handleAttend(event.id)}
                  />
                ))}
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="space-y-3 mt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Past</p>
                {pastEvents.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    isAttending={attendedIds.has(event.id)}
                    onAttend={() => handleAttend(event.id)}
                    isPast
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  index,
  isAttending,
  onAttend,
  isPast = false,
}: {
  event: CampusEvent;
  index: number;
  isAttending: boolean;
  onAttend: () => void;
  isPast?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl shadow-elevated overflow-hidden bg-card ${isPast ? "opacity-60" : ""}`}
    >
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-primary/20 to-campus-purple/20 relative">
        {event.cover_image ? (
          <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays size={32} className="text-primary/30" />
          </div>
        )}
        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center shadow-card">
          <p className="text-[10px] font-bold text-primary uppercase">
            {format(new Date(event.event_date), "MMM")}
          </p>
          <p className="text-lg font-extrabold text-foreground leading-none">
            {format(new Date(event.event_date), "d")}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-[15px]">{event.title}</h3>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays size={13} />
            {format(new Date(event.event_date), "EEE, h:mm a")}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={13} />
              {event.location_name}
            </span>
          )}
        </div>

        {/* Attend button */}
        <div className="flex items-center justify-between mt-4">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={13} />
            {event.attendees_count} attending
          </span>
          {!isPast && (
            <button
              onClick={onAttend}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isAttending
                  ? "bg-campus-green/15 text-campus-green"
                  : "bg-primary text-primary-foreground shadow-card hover:shadow-elevated"
              }`}
            >
              {isAttending ? (
                <>
                  <CheckCircle2 size={14} />
                  Attending
                </>
              ) : (
                "Join Event"
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
