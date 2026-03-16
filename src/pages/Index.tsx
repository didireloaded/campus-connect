import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/feed/PostCard";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { Bell, Loader2 } from "lucide-react";

interface PostWithProfile {
  id: string;
  user_id: string;
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

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniShortName, setUniShortName] = useState("");

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url, full_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data as unknown as PostWithProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    // Get university short name
    if (profile?.university_id) {
      supabase
        .from("universities")
        .select("short_name, name")
        .eq("id", profile.university_id)
        .single()
        .then(({ data }) => {
          if (data) setUniShortName((data as any).short_name || (data as any).name);
        });
    }

    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts, profile]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Camp<span className="text-primary">Life</span>
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {uniShortName && (
            <span className="text-[10px] font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full mr-2">
              {uniShortName}
            </span>
          )}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 text-foreground"
          >
            <Bell size={22} />
          </button>
        </div>
      </header>

      {/* Stories */}
      <StoriesBar />

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Feed */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-4xl mb-3">📸</p>
            <p className="font-semibold text-foreground">Your campus feed is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to post! Tap the + button to share what's happening.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
