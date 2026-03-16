/**
 * UserProfilePage — View another student's public profile
 * 
 * Route: /profile/:username  (add to App.tsx)
 * 
 * Features:
 *  - Follow / Unfollow
 *  - Shows their posts grid
 *  - Tap a post to view full-size
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { postService, PostWithProfile } from "@/services/postService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Loader2, UserCheck, UserPlus } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";

interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  university_id: string | null;
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [universityName, setUniversityName] = useState("");

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (!data) { setLoading(false); return; }
      setProfileData(data as PublicProfile);

      const [userPosts] = await Promise.all([
        postService.fetchUserPosts(data.id),
      ]);
      setPosts(userPosts);

      if (user && user.id !== data.id) {
        const following = await profileService.isFollowing(user.id, data.id);
        setIsFollowing(following);
      }

      if (data.university_id) {
        profileService.getUniversity(data.university_id).then((uni) => {
          setUniversityName((uni as any).short_name || (uni as any).name);
        }).catch(() => {});
      }

      setLoading(false);
    };
    load();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profileData) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileService.unfollow(user.id, profileData.id);
        setIsFollowing(false);
        setProfileData((p) => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p);
      } else {
        await profileService.follow(user.id, profileData.id);
        setIsFollowing(true);
        setProfileData((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
        notificationService.createNotification({
          userId: profileData.id,
          actorId: user.id,
          type: "follow",
          referenceId: user.id,
        }).catch(() => {});
        toast.success(`Following @${profileData.username}`);
      }
    } catch {
      toast.error("Failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6">
        <p className="text-4xl">🤷</p>
        <p className="font-semibold text-foreground">User not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">Go back</button>
      </div>
    );
  }

  const isOwnProfile = user?.id === profileData.id;
  const initials = profileData.full_name
    ? profileData.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profileData.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 truncate">
          @{profileData.username}
        </h1>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-4">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={profileData.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-lg font-extrabold text-foreground">{posts.length}</p>
                <p className="text-[11px] text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">{profileData.followers_count}</p>
                <p className="text-[11px] text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">{profileData.following_count}</p>
                <p className="text-[11px] text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground">{profileData.full_name}</p>
          {profileData.bio && <p className="text-[13px] text-foreground mt-0.5">{profileData.bio}</p>}
          {universityName && (
            <p className="text-[12px] text-primary font-medium mt-1 flex items-center gap-1">
              <MapPin size={12} /> {universityName}
            </p>
          )}
        </div>

        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`w-full mt-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              isFollowing
                ? "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {followLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isFollowing ? (
              <><UserCheck size={15} /> Following</>
            ) : (
              <><UserPlus size={15} /> Follow</>
            )}
          </button>
        )}
      </motion.div>

      <div className="border-t border-border pb-20 divide-y divide-border">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm font-semibold text-foreground">No Posts Yet</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
