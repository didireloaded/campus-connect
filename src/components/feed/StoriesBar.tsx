import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStories } from "@/hooks/useStories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { CreateStorySheet } from "@/components/create/CreateStorySheet";

export const StoriesBar = () => {
  const { user, profile } = useAuth();
  const { storyGroups } = useStories();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const myGroup = storyGroups.find((g) => g.user_id === user?.id);
  const otherGroups = storyGroups.filter((g) => g.user_id !== user?.id);

  const openViewer = (userId: string) => {
    navigate(`/story?userId=${userId}`);
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {/* Your Story */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            onClick={() => {
              if (myGroup && myGroup.stories.length > 0) {
                openViewer(user!.id);
              } else {
                setCreateOpen(true);
              }
            }}
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-full overflow-hidden border ${myGroup?.stories.length ? "border-primary/50" : "border-border"}`}>
                <Avatar className="w-full h-full rounded-full">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {profile?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background"
                onClick={(e) => { e.stopPropagation(); setCreateOpen(true); }}
              >
                <Plus size={10} className="text-primary-foreground" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Your story</span>
          </motion.div>

          {/* Other Stories */}
          {otherGroups.map((group, i) => (
            <motion.div
              key={group.user_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              onClick={() => openViewer(group.user_id)}
            >
              <div className={`w-12 h-12 rounded-full p-[1.5px] ${group.hasUnviewed ? "bg-gradient-to-br from-primary to-primary/40" : "bg-border"}`}>
                <div className="w-full h-full rounded-full bg-background p-[1.5px]">
                  <Avatar className="w-full h-full rounded-full">
                    <AvatarImage src={group.profile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {group.profile?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground font-medium max-w-[48px] truncate group-hover:text-primary transition-colors">
                {group.profile?.username}
              </span>
            </motion.div>
          ))}

          {/* Placeholder when empty */}
          {otherGroups.length === 0 &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-12 h-12 rounded-full bg-accent animate-pulse" />
                <div className="w-8 h-1.5 bg-accent rounded animate-pulse" />
              </div>
            ))}
        </div>
      </div>
      <CreateStorySheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
};
