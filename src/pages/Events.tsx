import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, MapPin, Users, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [locationName, setLocationName] = useState("");

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("*, profiles(username, avatar_url)")
      .order("event_date", { ascending: true })
      .limit(50);
    if (data) setEvents(data as unknown as CampusEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async () => {
    if (!title || !eventDate || !user || !profile?.university_id) return;
    setCreating(true);
    const { error } = await supabase.from("events").insert({
      creator_id: user.id,
      university_id: profile.university_id,
      title,
      description: description || null,
      event_date: eventDate,
      location_name: locationName || null,
    });
    if (error) toast.error("Failed to create event");
    else {
      toast.success("Event created!");
      setShowCreate(false);
      setTitle(""); setDescription(""); setEventDate(""); setLocationName("");
      fetchEvents();
    }
    setCreating(false);
  };

  const handleAttend = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from("event_attendees").insert({
      event_id: eventId,
      user_id: user.id,
    });
    if (error?.code === "23505") toast.info("Already attending");
    else if (error) toast.error("Failed to RSVP");
    else toast.success("You're attending!");
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Events</h1>
          <p className="text-xs text-muted-foreground">Campus happenings</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          <span className="ml-1">{showCreate ? "Cancel" : "Create"}</span>
        </Button>
      </header>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-card shadow-card"
          >
            <div className="p-4 space-y-3">
              <div><Label>Title</Label><Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label>Description</Label><Textarea placeholder="What's happening?" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" /></div>
              <div><Label>Date & Time</Label><Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
              <div><Label>Location</Label><Input placeholder="Where?" value={locationName} onChange={(e) => setLocationName(e.target.value)} /></div>
              <Button onClick={handleCreate} disabled={!title || !eventDate || creating} className="w-full">
                {creating ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 space-y-3 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-20">No events yet</p>
        ) : (
          events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-elevated overflow-hidden"
            >
              {event.cover_image && (
                <img src={event.cover_image} alt="" className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    {format(new Date(event.event_date), "MMM d, h:mm a")}
                  </span>
                  {event.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {event.attendees_count} attending
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleAttend(event.id)}
                >
                  Join Event
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
