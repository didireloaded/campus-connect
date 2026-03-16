import { useAuth } from "@/contexts/AuthContext";
import { useStories } from "@/hooks/useStories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

export const StoriesBar = () => {
  const { user, profile } = useAuth();
  const { stories } = useStories();

  const otherStories = stories.filter((s) => s.user_id !== user?.id);

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
        {otherStories.map((story) => (
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
            <span className="text-[10px] text-foreground font-medium max-w-[60px] truncate">{story.username}</span>
          </div>
        ))}

        {/* Placeholder when empty */}
        {otherStories.length === 0 &&
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
