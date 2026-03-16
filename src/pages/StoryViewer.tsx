import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
  id: string;
  media_url: string;
  created_at: string;
  view_count: number;
  user_id: string;
  profiles?: { username: string; avatar_url: string | null };
}

const STORY_DURATION = 5000;

export default function StoryViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("stories")
      .select("*, profiles(username, avatar_url)")
      .eq("user_id", userId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => setStories((data as any[]) || []));
  }, [userId]);

  const story = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      setLiked(false);
    } else {
      navigate(-1);
    }
  }, [currentIndex, stories.length, navigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
      setLiked(false);
    }
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { goNext(); return 0; }
        return p + (100 / (STORY_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex, story, goNext]);

  // Tap zones
  const handleTap = (e: React.MouseEvent) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width / 3) goPrev();
    else goNext();
  };

  if (!story) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <button onClick={() => navigate(-1)} className="text-white">
          <X size={32} />
        </button>
      </div>
    );
  }

  const username = (story as any).profiles?.username || "Unknown";
  const avatar = (story as any).profiles?.avatar_url;
  const timeAgo = getTimeAgo(story.created_at);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col max-w-lg mx-auto">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden border border-white/50">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/30" />
            )}
          </div>
          <span className="text-white text-sm font-semibold">{username}</span>
          <span className="text-white/60 text-xs">{timeAgo}</span>
        </div>
        <button onClick={() => navigate(-1)}>
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* Story image */}
      <div className="flex-1 relative" onClick={handleTap}>
        <AnimatePresence mode="wait">
          <motion.img
            key={story.id}
            src={story.media_url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-5 pb-8">
        <div className="flex items-center gap-1.5 text-white/70">
          <Eye size={16} />
          <span className="text-sm">{story.view_count || 0}</span>
        </div>
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        >
          <Heart size={24} className={liked ? "text-red-500 fill-red-500" : "text-white"} />
        </motion.button>
      </div>
    </div>
  );
}

function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
