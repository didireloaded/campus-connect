import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Heart,
  MessageCircle,
  UserPlus,
  CalendarDays,
  Loader2,
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  AtSign,
  BookmarkCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNowStrict, isToday, isYesterday, isThisWeek } from "date-fns";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useMemo, useState } from "react";
import type { NotificationWithActor } from "@/services/notificationService";

type FilterKey = "all" | "social" | "mentions" | "campus";

const TYPE_META: Record<
  string,
  { Icon: typeof Heart; label: (name: string) => string; tint: string; bucket: FilterKey; route: (refId?: string | null) => string | null }
> = {
  like: {
    Icon: Heart,
    label: (n) => `${n} liked your post`,
    tint: "bg-rose-500",
    bucket: "social",
    route: () => "/profile",
  },
  comment: {
    Icon: MessageCircle,
    label: (n) => `${n} commented on your post`,
    tint: "bg-sky-500",
    bucket: "mentions",
    route: () => "/profile",
  },
  reply: {
    Icon: AtSign,
    label: (n) => `${n} replied to you`,
    tint: "bg-violet-500",
    bucket: "mentions",
    route: () => "/profile",
  },
  follow: {
    Icon: UserPlus,
    label: (n) => `${n} started following you`,
    tint: "bg-emerald-500",
    bucket: "social",
    route: (refId) => (refId ? `/profile/${refId}` : "/profile"),
  },
  event_reminder: {
    Icon: CalendarDays,
    label: () => "An event is starting soon",
    tint: "bg-amber-500",
    bucket: "campus",
    route: (refId) => (refId ? `/event-detail?id=${refId}` : "/events"),
  },
  study_group_join: {
    Icon: BookmarkCheck,
    label: (n) => `${n} joined your study group`,
    tint: "bg-primary",
    bucket: "campus",
    route: (refId) => (refId ? `/study-group?id=${refId}` : "/study-groups"),
  },
  new_message: {
    Icon: MessageCircle,
    label: (n) => `${n} sent you a message`,
    tint: "bg-sky-500",
    bucket: "mentions",
    route: () => "/messages",
  },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mentions", label: "Mentions" },
  { key: "social", label: "Social" },
  { key: "campus", label: "Campus" },
];

function groupByDate(items: NotificationWithActor[]) {
  const groups: Record<string, NotificationWithActor[]> = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };
  for (const n of items) {
    const d = new Date(n.created_at);
    if (isToday(d)) groups.Today.push(n);
    else if (isYesterday(d)) groups.Yesterday.push(n);
    else if (isThisWeek(d, { weekStartsOn: 1 })) groups["This Week"].push(n);
    else groups.Earlier.push(n);
  }
  return groups;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAllRead, markRead, dismiss, clearAll } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => (TYPE_META[n.type]?.bucket ?? "social") === filter);
  }, [notifications, filter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const handleTap = (n: NotificationWithActor) => {
    if (!n.read) markRead(n.id);
    const meta = TYPE_META[n.type];
    const dest = meta?.route(n.reference_id);
    if (dest) navigate(dest);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-10">
      {/* Sticky native-style header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:bg-muted/50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-semibold text-primary px-2.5 py-1.5 rounded-full active:bg-primary/10 transition-colors flex items-center gap-1"
              >
                <CheckCheck size={13} /> Read all
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted/50 transition-colors"
                aria-label="Clear all"
              >
                <Trash2 size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-2">
          <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {unreadCount} new {unreadCount === 1 ? "update" : "updates"}
            </p>
          )}
        </div>

        {/* Segmented filter pills */}
        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-muted-foreground active:bg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={26} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="pt-2">
          <AnimatePresence initial={false}>
            {Object.entries(groups).map(([section, items]) =>
              items.length === 0 ? null : (
                <motion.section
                  key={section}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-3"
                >
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-4 pt-3 pb-1.5">
                    {section}
                  </h2>
                  <div>
                    {items.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onTap={() => handleTap(n)}
                        onDismiss={() => dismiss(n.id)}
                      />
                    ))}
                  </div>
                </motion.section>
              )
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onTap,
  onDismiss,
}: {
  notification: NotificationWithActor;
  onTap: () => void;
  onDismiss: () => void;
}) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.like;
  const { Icon } = meta;
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -40, 0], [1, 0.4, 0]);
  const trashScale = useTransform(x, [-120, -50, 0], [1, 0.6, 0.4]);
  const name = notification.actor?.username || "Someone";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative overflow-hidden"
    >
      {/* Swipe-action background */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 bg-destructive flex items-center justify-end pr-6"
      >
        <motion.div style={{ scale: trashScale }}>
          <Trash2 size={20} className="text-destructive-foreground" />
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        onClick={onTap}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90 || info.velocity.x < -500) onDismiss();
        }}
        whileTap={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
        className={`relative w-full text-left flex items-center gap-3 px-4 py-3 ${
          !notification.read ? "bg-primary/[0.04]" : "bg-background"
        }`}
      >
        {/* Avatar with type badge */}
        <div className="relative shrink-0">
          <Avatar className="h-11 w-11 border border-border/40">
            <AvatarImage src={notification.actor?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-foreground text-[13px] font-semibold">
              {name[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full ${meta.tint} flex items-center justify-center border-[2px] border-background`}
          >
            <Icon size={9} className="text-white" strokeWidth={2.8} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] text-foreground leading-snug">
            <span className="font-semibold">{name}</span>{" "}
            <span className="text-muted-foreground">
              {meta.label(name).replace(name, "").trim()}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {!notification.read && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]" />
        )}
      </motion.button>
    </motion.div>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const copy: Record<FilterKey, { title: string; sub: string }> = {
    all: { title: "You're all caught up", sub: "New activity from your campus shows up here." },
    mentions: { title: "No mentions yet", sub: "Replies and comments will land here." },
    social: { title: "Quiet on the social front", sub: "Likes and follows will appear here." },
    campus: { title: "Nothing from campus", sub: "Event reminders and group updates show here." },
  };
  const { title, sub } = copy[filter];
  return (
    <div className="text-center pt-24 px-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4"
      >
        <Bell size={26} className="text-muted-foreground" />
      </motion.div>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{sub}</p>
    </div>
  );
}
