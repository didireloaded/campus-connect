import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface StoryGroup {
  user_id: string;
  username: string;
  avatar_url: string | null;
  story_count: number;
}

export const StoriesBar = () => {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<StoryGroup[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      // Get distinct users who have active stories in the same university
      const { data } = await supabase
        .from("stories")
        .select("user_id, profiles(username, avatar_url)")
        .order("created_at", { ascending: false });

      if (data) {
        const grouped = new Map<string, StoryGroup>();
        for (const s of data as any[]) {
          if (!grouped.has(s.user_id)) {
            grouped.set(s.user_id, {
              user_id: s.user_id,
              username: s.profiles?.username || "user",
              avatar_url: s.profiles?.avatar_url,
              story_count: 1,
            });
          } else {
            grouped.get(s.user_id)!.story_count++;
          }
        }
        setStories(Array.from(grouped.values()));
      }
    };
    fetchStories();
  }, []);

  return (
    <div className="px-4 py-3">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {/* Add Story */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center relative">
            <Avatar className="w-14 h-14">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {profile?.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
              <Plus size={12} className="text-primary-foreground" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Your story</span>
        </div>

        {/* Other Stories */}
        {stories
          .filter((s) => s.user_id !== user?.id)
          .map((story) => (
            <div key={story.user_id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-campus-orange via-destructive to-campus-purple">
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={story.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {story.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[10px] text-foreground font-medium max-w-[60px] truncate">
                {story.username}
              </span>
            </div>
          ))}

        {/* Placeholder stories when empty */}
        {stories.filter((s) => s.user_id !== user?.id).length === 0 &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-full bg-secondary animate-pulse" />
              <div className="w-10 h-2 bg-secondary rounded animate-pulse" />
            </div>
          ))}
      </div>
    </div>
  );
};
