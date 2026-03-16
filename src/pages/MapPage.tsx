import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CalendarDays, Loader2, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface MapEvent {
  id: string;
  title: string;
  event_date: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  attendees_count: number;
}

export default function MapPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, location_name, location_lat, location_lng, attendees_count")
        .order("event_date", { ascending: true })
        .limit(50);
      if (data) setEvents(data as MapEvent[]);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const eventsWithLocation = events.filter((e) => e.location_name);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Navigation size={20} className="text-primary" />
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Campus Map</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Events happening around campus</p>
      </header>

      {/* Map placeholder */}
      <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-primary/5 via-campus-blue-light to-campus-green/5 border border-border aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {/* Grid pattern */}
          <div className="w-full h-full" style={{
            backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>
        <div className="relative z-10 text-center">
          <MapPin size={40} className="text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Campus Activity Map</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Interactive map coming soon. See event locations below.
          </p>
        </div>

        {/* Floating pins */}
        {eventsWithLocation.slice(0, 4).map((event, i) => {
          const positions = [
            { top: "20%", left: "25%" },
            { top: "35%", right: "20%" },
            { bottom: "30%", left: "35%" },
            { bottom: "20%", right: "30%" },
          ];
          return (
            <motion.div
              key={event.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
              className="absolute z-20"
              style={positions[i]}
            >
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-elevated text-xs font-bold">
                <MapPin size={16} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event list */}
      <div className="px-4 mt-4 pb-20">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          {eventsWithLocation.length} Events with locations
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : eventsWithLocation.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No events with locations yet
          </p>
        ) : (
          <div className="space-y-2">
            {eventsWithLocation.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.location_name && (
                      <span className="text-[11px] text-muted-foreground truncate">{event.location_name}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-primary">
                    {format(new Date(event.event_date), "MMM d")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(event.event_date), "h:mm a")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
