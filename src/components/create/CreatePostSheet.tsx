import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreatePostSheet = ({ open, onClose }: Props) => {
  const { user, profile } = useAuth();
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
      toast.success("Posted to campus feed!");
      setContent("");
      onClose();
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Post to Campus Feed</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <Textarea
            placeholder="What's happening on campus?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-none bg-secondary focus-visible:ring-1 focus-visible:ring-primary/30 text-base"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <button className="text-muted-foreground hover:text-primary transition-colors p-2">
              <ImagePlus size={22} />
            </button>
            <Button onClick={handlePost} disabled={!content.trim() || loading} size="sm">
              <Send size={14} className="mr-1.5" />
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
