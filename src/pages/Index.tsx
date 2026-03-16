import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePostBar } from "@/components/feed/CreatePostBar";
import { Loader2 } from "lucide-react";

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

export default function Index() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Realtime subscription
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const universityName = profile?.university_id ? "your campus" : "CampLife";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 border-b border-border">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          Camp<span className="text-primary">Life</span>
        </h1>
        <p className="text-xs text-muted-foreground capitalize">Feed from {universityName}</p>
      </header>

      {/* Create Post */}
      <div className="mt-2">
        <CreatePostBar onPostCreated={fetchPosts} />
      </div>

      {/* Feed */}
      <div className="mt-2 space-y-2 pb-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-muted-foreground text-sm">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeToggle={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
