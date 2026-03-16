import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService, PostWithProfile } from "@/services/postService";
import { profileService } from "@/services/profileService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Grid3X3, Loader2, MapPin } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [universityName, setUniversityName] = useState("");

  useEffect(() => {
    if (!user) return;
    postService.fetchUserPosts(user.id).then(setPosts).finally(() => setLoading(false));
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
          <button className="text-foreground"><Settings size={22} /></button>
          <button onClick={signOut} className="text-foreground"><LogOut size={22} /></button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-4">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1">
            <div className="flex justify-around text-center">
              <div><p className="text-lg font-extrabold text-foreground">{posts.length}</p><p className="text-[11px] text-muted-foreground">Posts</p></div>
              <div><p className="text-lg font-extrabold text-foreground">{profile?.followers_count || 0}</p><p className="text-[11px] text-muted-foreground">Followers</p></div>
              <div><p className="text-lg font-extrabold text-foreground">{profile?.following_count || 0}</p><p className="text-[11px] text-muted-foreground">Following</p></div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
          {profile?.bio && <p className="text-[13px] text-foreground mt-0.5">{profile.bio}</p>}
          {universityName && <p className="text-[12px] text-primary font-medium mt-1 flex items-center gap-1"><MapPin size={12} /> {universityName}</p>}
        </div>
        <button className="w-full mt-4 py-1.5 rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground hover:bg-accent transition-colors">
          Edit Profile
        </button>
      </motion.div>

      <div className="border-t border-b border-border flex justify-center py-2.5">
        <div className="flex items-center gap-1 text-foreground">
          <Grid3X3 size={14} /><span className="text-[11px] font-bold uppercase tracking-wider">Posts</span>
        </div>
      </div>

      <div className="divide-y divide-border pb-20">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm font-semibold text-foreground">No Posts Yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your first campus moment</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
