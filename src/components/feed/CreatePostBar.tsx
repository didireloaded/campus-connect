import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePostBarProps {
  onPostCreated: () => void;
}

export const CreatePostBar = ({ onPostCreated }: CreatePostBarProps) => {
  const { user, profile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim() || !user || !profile?.university_id) return;
    setLoading(true);

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      university_id: profile.university_id,
      content: content.trim(),
    });

    if (error) toast.error("Failed to post");
    else {
      setContent("");
      setExpanded(false);
      onPostCreated();
      toast.success("Posted!");
    }
    setLoading(false);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="bg-card px-4 py-3 shadow-card">
      <div
        className="flex items-center gap-3 cursor-text"
        onClick={() => setExpanded(true)}
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!expanded && (
          <div className="flex-1 bg-secondary rounded-full px-4 py-2">
            <span className="text-sm text-muted-foreground">What's happening on campus?</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Textarea
              placeholder="What's happening on campus?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-3 min-h-[80px] resize-none border-none bg-secondary focus-visible:ring-1 focus-visible:ring-primary/30"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <ImagePlus size={20} />
              </button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setExpanded(false); setContent(""); }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handlePost}
                  disabled={!content.trim() || loading}
                >
                  <Send size={14} className="mr-1" />
                  {loading ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
