import { useAuth } from "@/contexts/AuthContext";
import { useStories } from "@/hooks/useStories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export const StoriesBar = () => {
  const { user, profile } = useAuth();
  const { stories } = useStories();

  const otherStories = stories.filter((s) => s.user_id !== user?.id);

  return (
    <div className="px-4 py-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {/* Your Story */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <div className="relative">
            <div className="w-[68px] h-[68px] rounded-2xl bg-secondary overflow-hidden">
              <Avatar className="w-full h-full rounded-2xl">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold rounded-2xl">
                  {profile?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-lg flex items-center justify-center border-2 border-background shadow-glow">
              <Plus size={12} className="text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Your story</span>
        </motion.div>

        {/* Other Stories */}
        {otherStories.map((story, i) => (
          <motion.div
            key={story.user_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-[68px] h-[68px] rounded-2xl p-[2.5px] bg-gradient-to-br from-primary via-destructive to-campus-purple">
              <div className="w-full h-full rounded-[14px] bg-background p-[2px]">
                <Avatar className="w-full h-full rounded-[12px]">
                  <AvatarImage src={story.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold rounded-[12px]">
                    {story.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[10px] text-foreground font-medium max-w-[64px] truncate group-hover:text-primary transition-colors">
              {story.username}
            </span>
          </motion.div>
        ))}

        {/* Placeholder when empty */}
        {otherStories.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-[68px] h-[68px] rounded-2xl bg-secondary/60 animate-pulse" />
              <div className="w-10 h-2 bg-secondary rounded animate-pulse" />
            </div>
          ))}
      </div>
    </div>
  );
};
