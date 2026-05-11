import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStories, Story } from "@/hooks/useStories";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STORY_DURATION = 5000;

export default function StoryViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const { user } = useAuth();
  const { storyGroups, markViewed, deleteStory } = useStories();

  const groupIndex = storyGroups.findIndex((g) => g.user_id === userId);
  const group = groupIndex >= 0 ? storyGroups[groupIndex] : undefined;
  const stories = group?.stories || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const story = stories[currentIndex] as Story | undefined;
  const isOwn = userId === user?.id;

  const goToGroup = useCallback((idx: number) => {
    const g = storyGroups[idx];
    if (!g) {
      navigate(-1);
      return;
    }
    setCurrentIndex(0);
    setProgress(0);
    setLiked(false);
    navigate(`/story?userId=${g.user_id}`, { replace: true });
  }, [storyGroups, navigate]);

  // Mark viewed on each story change
  useEffect(() => {
    if (story && !story.viewed && !isOwn) {
      markViewed(story.id);
    }
  }, [story?.id]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      setLiked(false);
    } else {
      // Move to next user's stories (Instagram-style)
      goToGroup(groupIndex + 1);
    }
  }, [currentIndex, stories.length, goToGroup, groupIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
      setLiked(false);
    } else if (groupIndex > 0) {
      // Go to previous user's last story
      const prev = storyGroups[groupIndex - 1];
      if (prev) {
        const lastIdx = Math.max(prev.stories.length - 1, 0);
        navigate(`/story?userId=${prev.user_id}`, { replace: true });
        setCurrentIndex(lastIdx);
        setProgress(0);
        setLiked(false);
      }
    }
  }, [currentIndex, groupIndex, storyGroups, navigate]);

  // Auto-advance timer
  useEffect(() => {
    if (!story || paused) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 100 / (STORY_DURATION / 50);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex, story, goNext, paused]);

  const handleTap = (e: React.MouseEvent) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width / 3) goPrev();
    else goNext();
  };

  const handleDelete = async () => {
    if (!story) return;
    try {
      await deleteStory(story.id);
      toast.success("Story deleted");
      if (stories.length <= 1) navigate(-1);
      else setCurrentIndex((i) => Math.min(i, stories.length - 2));
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!group || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No stories to show</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">Go back</button>
        </div>
      </div>
    );
  }

  const username = story?.profile?.username || "Unknown";
  const avatar = story?.profile?.avatar_url;
  const timeAgo = story ? getTimeAgo(story.created_at) : "";

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
        <div className="flex items-center gap-2">
          {isOwn && (
            <button onClick={handleDelete}>
              <Trash2 size={20} className="text-white/70 hover:text-red-400" />
            </button>
          )}
          <button onClick={() => navigate(-1)}>
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Story media */}
      <div
        className="flex-1 relative"
        onClick={handleTap}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <AnimatePresence mode="wait">
          {story && (
            story.media_type === "video" ? (
              <motion.video
                key={story.id}
                src={story.media_url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ backgroundColor: story.bg_color || "#111" }}
                autoPlay
                muted
                playsInline
              />
            ) : (
              <motion.img
                key={story.id}
                src={story.media_url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ backgroundColor: story.bg_color || "#111" }}
              />
            )
          )}
        </AnimatePresence>

        {/* Caption overlay */}
        {story?.caption && (
          <div className="absolute bottom-16 left-0 right-0 z-10 px-6 text-center">
            <p className="text-white text-sm bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
              {story.caption}
            </p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-5 pb-8">
        <div className="flex items-center gap-1.5 text-white/70">
          <Eye size={16} />
          <span className="text-sm">{story?.view_count || 0}</span>
        </div>
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
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
