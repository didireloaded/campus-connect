import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Clock, Users, Calendar, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location_name: string | null;
  cover_image: string | null;
  attendees_count: number;
  creator_id: string;
  profiles?: { username: string; avatar_url: string | null; full_name: string | null };
}

export default function EventDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("id");
  const { profile } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attending, setAttending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      supabase.from("events").select("*, profiles(username, avatar_url, full_name)").eq("id", eventId).single(),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return false;
        const { data } = await supabase.from("event_attendees").select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle();
        return !!data;
      }),
    ]).then(([eventRes, isAttending]) => {
      setEvent(eventRes.data as any);
      setAttending(isAttending as boolean);
      setLoading(false);
    });
  }, [eventId]);

  const toggleAttend = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !eventId) return;
    if (attending) {
      await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
      setAttending(false);
      toast.success("You're no longer attending");
    } else {
      await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
      setAttending(true);
      toast.success("You're attending! 🎉");
    }
  };

  if (loading || !event) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  const creator = (event as any).profiles;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Cover image */}
      <div className="relative h-56 bg-secondary">
        {event.cover_image && (
          <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground">{event.title}</h1>

          {creator && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                {creator.avatar_url && <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-xs text-muted-foreground">by {creator.full_name || creator.username}</span>
            </div>
          )}

          {/* Info cards */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-card rounded-xl p-3 border border-border">
              <Calendar size={14} className="text-primary mb-1" />
              <p className="text-xs font-semibold text-foreground">{format(new Date(event.event_date), "MMM d, yyyy")}</p>
              <p className="text-[10px] text-muted-foreground">{format(new Date(event.event_date), "h:mm a")}</p>
            </div>
            {event.location_name && (
              <div className="flex-1 bg-card rounded-xl p-3 border border-border">
                <MapPin size={14} className="text-primary mb-1" />
                <p className="text-xs font-semibold text-foreground">{event.location_name}</p>
              </div>
            )}
            <div className="flex-1 bg-card rounded-xl p-3 border border-border">
              <Users size={14} className="text-primary mb-1" />
              <p className="text-xs font-semibold text-foreground">{event.attendees_count || 0}</p>
              <p className="text-[10px] text-muted-foreground">attending</p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-4 bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-bold text-foreground mb-2">About</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Attend button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={toggleAttend}
            className={`w-full py-3.5 rounded-2xl font-bold text-[15px] mt-6 mb-8 flex items-center justify-center gap-2 ${
              attending
                ? "bg-secondary text-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {attending ? <><CheckCircle size={18} /> Attending</> : "I'm Going! 🎉"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
