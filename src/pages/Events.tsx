import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { eventService } from "@/services/eventService";
import { CalendarDays, MapPin, Users, Loader2, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format, isPast } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  { label: "All Events", emoji: null },
  { label: "Arts", emoji: "🎨" },
  { label: "Athletics", emoji: "⚽" },
  { label: "Social", emoji: "💬" },
  { label: "Cultural", emoji: "🌍" },
  { label: "Academic", emoji: "📚" },
  { label: "Community", emoji: "🤝" },
];

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { events, attendedIds, loading, refresh } = useEvents();
  const [activeCategory, setActiveCategory] = useState("All Events");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAttend = async (eventId: string) => {
    if (!user) return;
    const isAttending = attendedIds.has(eventId);
    try {
      if (isAttending) {
        await eventService.unattend(eventId, user.id);
        toast.info("Removed from event");
      } else {
        await eventService.attend(eventId, user.id);
        toast.success("You're attending! 🎉");
      }
      refresh();
    } catch {
      toast.error("Failed");
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    // Category filter is cosmetic for now since events don't have categories in DB
    return matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter((e) => !isPast(new Date(e.event_date)));
  const pastEvents = filteredEvents.filter((e) => isPast(new Date(e.event_date)));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Events</h1>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">What's happening on campus</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-shadow"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                activeCategory === cat.label
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.emoji && <span className="text-sm">{cat.emoji}</span>}
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🗓️</p>
            <h3 className="text-xl font-bold text-foreground">No events found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery ? "Try a different search" : "Tap + to create the first campus event"}
            </p>
          </div>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <div className="space-y-4 mt-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Upcoming</p>
                {upcomingEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} isAttending={attendedIds.has(event.id)} onAttend={() => handleAttend(event.id)} onTap={() => navigate(`/event-detail?id=${event.id}`)} />
                ))}
              </div>
            )}
            {pastEvents.length > 0 && (
              <div className="space-y-4 mt-8">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Past</p>
                {pastEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} isAttending={attendedIds.has(event.id)} onAttend={() => handleAttend(event.id)} onTap={() => navigate(`/event-detail?id=${event.id}`)} isPast />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, index, isAttending, onAttend, onTap, isPast = false }: {
  event: any; index: number; isAttending: boolean; onAttend: () => void; onTap: () => void; isPast?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl overflow-hidden bg-card border border-border/50 shadow-elevated ${isPast ? "opacity-50" : ""}`}
    >
      {/* Tappable cover */}
      <button onClick={onTap} className="w-full text-left">
        <div className="h-36 bg-gradient-to-br from-primary/15 to-campus-purple/15 relative overflow-hidden">
          {event.cover_image ? (
            <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays size={36} className="text-primary/20" />
            </div>
          )}
          {/* Date badge */}
          <div className="absolute top-3 left-3 glass rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-primary uppercase tracking-wide">{format(new Date(event.event_date), "MMM")}</p>
            <p className="text-xl font-extrabold text-foreground leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {format(new Date(event.event_date), "d")}
            </p>
          </div>
        </div>
      </button>
      <div className="p-4">
        <h4 className="font-bold text-foreground text-[15px]">{event.title}</h4>
        {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays size={12} />{format(new Date(event.event_date), "EEE, h:mm a")}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin size={12} />{event.location_name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users size={13} />{event.attendees_count} attending
          </span>
          {!isPast && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAttend}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                isAttending
                  ? "bg-campus-green/15 text-campus-green"
                  : "bg-primary text-primary-foreground shadow-glow"
              }`}
            >
              {isAttending ? <><CheckCircle2 size={14} />Attending</> : "RSVP"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
