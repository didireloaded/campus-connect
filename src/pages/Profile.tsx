import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService, PostWithProfile } from "@/services/postService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Grid3X3, Loader2, MapPin, Camera, X, Check, CalendarDays, Heart } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DarkModeToggle } from "@/components/DarkModeToggle";

// ─── Edit Profile Sheet ───────────────────────────────────────────────────────

function EditProfileSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(profile?.full_name || "");
    setUsername(profile?.username || "");
    setBio(profile?.bio || "");
    setAvatarPreview(null);
    setAvatarFile(null);
  }, [open, profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await profileService.uploadAvatar(user.id, avatarFile);
      }
      await profileService.updateProfile(user.id, {
        full_name: fullName.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
      await refreshProfile();
      toast.success("Profile updated!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = avatarPreview || profile?.avatar_url || undefined;
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl pb-safe"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
              <h3 className="font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Edit Profile</h3>
              <button onClick={handleSave} disabled={saving} className="text-primary font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
            <div className="px-4 pt-5 pb-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-[3px] ring-primary">
                    <AvatarImage src={currentAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-glow"
                  >
                    <Camera size={14} className="text-primary-foreground" />
                  </button>
                </div>
                <button onClick={() => fileRef.current?.click()} className="text-[13px] text-primary font-semibold">Change photo</button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="username" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bio</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell your campus what you're about…" className="mt-1 resize-none rounded-xl" rows={3} maxLength={160} />
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">{bio.length}/160</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

type ProfileTab = "posts" | "events" | "favorites";

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [universityName, setUniversityName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [attendedEvents, setAttendedEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loadPosts = () => {
    if (!user) return;
    postService.fetchUserPosts(user.id).then(setPosts).finally(() => setLoading(false));
  };

  const loadAttendedEvents = async () => {
    if (!user) return;
    setEventsLoading(true);
    const { data } = await supabase
      .from("event_attendees")
      .select("event_id, events(id, title, event_date, location_name, attendees_count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAttendedEvents((data || []).map((d: any) => d.events).filter(Boolean));
    setEventsLoading(false);
  };

  useEffect(() => {
    loadPosts();
    if (profile?.university_id) {
      profileService.getUniversity(profile.university_id).then((uni) => {
        setUniversityName((uni as any).short_name || (uni as any).name);
      }).catch(() => {});
    }
  }, [user, profile]);

  useEffect(() => {
    if (activeTab === "events" && attendedEvents.length === 0) loadAttendedEvents();
  }, [activeTab]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  const tabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: "posts", label: "Posts", icon: <Grid3X3 size={14} /> },
    { key: "events", label: "RSVPs", icon: <CalendarDays size={14} /> },
    { key: "favorites", label: "Favorites", icon: <Heart size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Profile</h2>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <button onClick={() => setEditOpen(true)} className="text-foreground"><Settings size={20} /></button>
          <button onClick={signOut} className="text-muted-foreground"><LogOut size={20} /></button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 py-5">
        {/* Avatar + stats */}
        <div className="text-center">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 ring-[3px] ring-primary">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => setEditOpen(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-glow"
            >
              <Camera size={14} className="text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-3">{profile?.full_name || profile?.username}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">@{profile?.username}</p>
          {universityName && (
            <p className="text-[12px] text-primary font-semibold mt-2 flex items-center justify-center gap-1">
              <MapPin size={12} /> {universityName}
            </p>
          )}
          {profile?.bio && <p className="text-[13px] text-foreground mt-2 px-6 leading-relaxed">{profile.bio}</p>}
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-10 mt-5">
          <div className="text-center">
            <p className="text-lg font-extrabold text-foreground">{posts.length}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold text-foreground">{profile?.followers_count || 0}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold text-foreground">{profile?.following_count || 0}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Following</p>
          </div>
        </div>

        {/* Edit profile button */}
        <button
          onClick={() => setEditOpen(true)}
          className="w-full mt-5 py-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground hover:bg-accent transition-colors"
        >
          Edit Profile
        </button>
      </motion.div>

      {/* Segmented tabs */}
      <div className="mx-5 mb-4 bg-secondary rounded-2xl p-1 flex h-11">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pb-24">
        {activeTab === "posts" && (
          <div className="px-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">📷</p>
                <p className="text-sm font-semibold text-foreground">No Posts Yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your first campus moment</p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} onUpdate={loadPosts} />)
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="px-4 space-y-3">
            {eventsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : attendedEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">🗓️</p>
                <p className="text-sm font-semibold text-foreground">No RSVPs Yet</p>
                <p className="text-xs text-muted-foreground mt-1">Events you RSVP to will appear here</p>
              </div>
            ) : (
              attendedEvents.map((ev: any) => (
                <div key={ev.id} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card flex gap-3 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                    <CalendarDays size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{ev.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ev.event_date && new Date(ev.event_date).toLocaleDateString()}
                    </p>
                    {ev.location_name && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {ev.location_name}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">❤️</p>
            <p className="text-sm font-semibold text-foreground">Favorites</p>
            <p className="text-xs text-muted-foreground mt-1">Posts you've liked will appear here</p>
          </div>
        )}
      </div>

      <EditProfileSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={loadPosts}
      />
    </div>
  );
}
