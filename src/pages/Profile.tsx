import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Grid3X3, Loader2 } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { motion } from "framer-motion";

interface PostWithProfile {
  id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [universityName, setUniversityName] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles(username, avatar_url, full_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setPosts(data as unknown as PostWithProfile[]);
      setLoading(false);
    };

    const fetchUni = async () => {
      if (!profile?.university_id) return;
      const { data } = await supabase
        .from("universities")
        .select("name")
        .eq("id", profile.university_id)
        .single();
      if (data) setUniversityName(data.name);
    };

    fetchPosts();
    fetchUni();
  }, [user, profile]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{profile?.username || "Profile"}</h1>
        <div className="flex gap-2">
          <button className="text-muted-foreground"><Settings size={20} /></button>
          <button onClick={signOut} className="text-muted-foreground"><LogOut size={20} /></button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6"
      >
        {/* Profile Header */}
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{posts.length}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{profile?.followers_count || 0}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{profile?.following_count || 0}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-semibold text-foreground">{profile?.full_name}</p>
          {profile?.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
          {universityName && (
            <p className="text-xs text-primary font-medium mt-1">🎓 {universityName}</p>
          )}
        </div>

        <Button variant="outline" className="w-full mt-4" size="sm">
          Edit Profile
        </Button>
      </motion.div>

      {/* Posts Grid */}
      <div className="border-t border-border">
        <div className="flex items-center justify-center py-2">
          <Grid3X3 size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground ml-1">Posts</span>
        </div>
        <div className="space-y-2 pb-20">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">No posts yet</p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
}
