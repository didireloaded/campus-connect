import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Clock, Users, Calendar, CheckCircle, Share2, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface EventDetailData {
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
  const [event, setEvent] = useState<EventDetailData | null>(null);
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

  const handleShare = async () => {
    const url = `${window.location.origin}/event-detail?id=${eventId}`;
    if (navigator.share) {
      try { await navigator.share({ title: event?.title, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  if (loading || !event) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  const creator = (event as any).profiles;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 glass flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Event Details</h2>
        <button onClick={handleShare} className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
          <Share2 size={16} className="text-foreground" />
        </button>
      </header>

      {/* Event icon + title */}
      <div className="px-5 pt-5 flex gap-4 items-start">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
          <Calendar size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground leading-tight">{event.title}</h1>
          {creator && (
            <p className="text-[12px] text-muted-foreground mt-1.5">
              by <span className="font-semibold text-foreground">{creator.full_name || creator.username}</span>
            </p>
          )}
          <div className="flex flex-col gap-1.5 mt-3">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Clock size={13} className="text-muted-foreground shrink-0" />
              {format(new Date(event.event_date), "EEE, MMM d · h:mm a")}
            </div>
            {event.location_name && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <MapPin size={13} className="text-muted-foreground shrink-0" />
                {event.location_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="mx-5 mt-5 rounded-2xl overflow-hidden bg-secondary aspect-video">
        {event.cover_image ? (
          <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={48} className="text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* About section */}
      {event.description && (
        <div className="px-5 mt-5">
          <h3 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>About This Event</h3>
          <div className="bg-secondary rounded-2xl p-4 border-l-[3px] border-primary">
            <p className="text-[13px] text-foreground leading-relaxed">{event.description}</p>
          </div>
        </div>
      )}

      {/* Attendees */}
      <div className="px-5 mt-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={15} />
          <span className="font-semibold text-foreground">{event.attendees_count || 0}</span> people attending
        </div>
      </div>

      {/* RSVP Button */}
      <div className="px-5 pt-6 pb-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={toggleAttend}
          className={`w-full py-4 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${
            attending
              ? "bg-secondary text-foreground"
              : "bg-primary text-primary-foreground shadow-glow"
          }`}
        >
          {attending ? <><CheckCircle size={18} /> Attending</> : "RSVP 🎉"}
        </motion.button>
      </div>
    </div>
  );
}
