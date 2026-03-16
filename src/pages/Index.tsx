import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { useNotifications } from "@/hooks/useNotifications";
import { PostCard } from "@/components/feed/PostCard";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { Bell, Loader2, Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { profileService } from "@/services/profileService";

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, refresh } = usePosts();
  const { unreadCount } = useNotifications();
  const [uniName, setUniName] = useState("");
  const [uniShortName, setUniShortName] = useState("");

  useEffect(() => {
    if (profile?.university_id) {
      profileService.getUniversity(profile.university_id).then((uni) => {
        setUniShortName((uni as any).short_name || "");
        setUniName((uni as any).short_name || (uni as any).name || "Campus");
      }).catch(() => {});
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            {uniName ? `${uniName} Feed` : <>Camp<span className="text-primary">Life</span></>}
          </h1>
          {uniShortName && (
            <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">
              Only visible to {uniShortName} students
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate("/notifications")} className="relative p-2 text-foreground">
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
              </span>
            )}
          </button>
        </div>
      </header>

      <StoriesBar />
      <div className="h-px bg-border" />

      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-4xl mb-3">📸</p>
            <p className="font-semibold text-foreground">Your campus feed is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to post! Tap the + button to share what's happening.</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onUpdate={refresh} />)
        )}
      </div>
    </div>
  );
}
