import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService, PostWithProfile } from "@/services/postService";
import { profileService } from "@/services/profileService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Grid3X3, Loader2, MapPin, Camera, X, Check } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  // Sync fields if profile changes while sheet is open
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
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <button onClick={onClose} className="text-muted-foreground">
                <X size={20} />
              </button>
              <h3 className="font-bold text-foreground">Edit Profile</h3>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-primary font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save
              </button>
            </div>

            {/* Body */}
            <div className="px-4 pt-5 pb-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={currentAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Camera size={18} className="text-white" />
                  </button>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-[13px] text-primary font-semibold"
                >
                  Change photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    placeholder="username"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Bio
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your campus what you're about…"
                    className="mt-1 resize-none"
                    rows={3}
                    maxLength={160}
                  />
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

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [universityName, setUniversityName] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const loadPosts = () => {
    if (!user) return;
    postService.fetchUserPosts(user.id).then(setPosts).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
    if (profile?.university_id) {
      profileService.getUniversity(profile.university_id).then((uni) => {
        setUniversityName((uni as any).short_name || (uni as any).name);
      }).catch(() => {});
    }
  }, [user, profile]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{profile?.username || "Profile"}</h1>
        <div className="flex gap-3">
          <button onClick={() => setEditOpen(true)} className="text-foreground">
            <Settings size={22} />
          </button>
          <button onClick={signOut} className="text-foreground">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-4">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 pt-1">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-lg font-extrabold text-foreground">{posts.length}</p>
                <p className="text-[11px] text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">{profile?.followers_count || 0}</p>
                <p className="text-[11px] text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">{profile?.following_count || 0}</p>
                <p className="text-[11px] text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
          {profile?.bio && <p className="text-[13px] text-foreground mt-0.5">{profile.bio}</p>}
          {universityName && (
            <p className="text-[12px] text-primary font-medium mt-1 flex items-center gap-1">
              <MapPin size={12} /> {universityName}
            </p>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="w-full mt-4 py-1.5 rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground hover:bg-accent transition-colors"
        >
          Edit Profile
        </button>
      </motion.div>

      <div className="border-t border-b border-border flex justify-center py-2.5">
        <div className="flex items-center gap-1 text-foreground">
          <Grid3X3 size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Posts</span>
        </div>
      </div>

      <div className="divide-y divide-border pb-20">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
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

      <EditProfileSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={loadPosts}
      />
    </div>
  );
}
