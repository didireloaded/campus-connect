import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Ghost, Send } from "lucide-react";
import { toast } from "sonner";

const GHOST_NAMES = [
  "GhostFox", "MidnightLion", "CampusGhost", "ShadowOwl", "NightWolf",
  "PhantomEagle", "SilentViper", "MysticRaven", "HiddenPanther", "StealthHawk",
  "NightOwl", "CoffeeAddict", "DarkFalcon", "CryptoLynx", "SilverFox",
];

const generateAlias = () => {
  const name = GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${name}${num}`;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateWallPostSheet = ({ open, onClose }: Props) => {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [alias] = useState(generateAlias());

  const handlePost = async () => {
    if (!content.trim() || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("wall_posts").insert({
      university_id: profile.university_id,
      content: content.trim(),
      alias,
    } as any);
    if (error) toast.error("Failed to post");
    else {
      toast.success("Posted anonymously!");
      setContent("");
      onClose();
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto bg-campus-ghost text-primary-foreground border-muted/20">
        <SheetHeader>
          <SheetTitle className="text-left text-primary-foreground flex items-center gap-2">
            <Ghost size={18} className="text-campus-orange" />
            Post to The Wall
          </SheetTitle>
        </SheetHeader>
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-3">
            Posting as <span className="text-campus-orange font-semibold">🎭 {alias}</span> · disappears in 24h
          </p>
          <Textarea
            placeholder="Speak your mind anonymously..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none bg-muted/20 border-muted/20 text-primary-foreground placeholder:text-muted-foreground focus-visible:ring-campus-orange/30 text-base"
            autoFocus
          />
          <div className="flex justify-end mt-4">
            <Button
              onClick={handlePost}
              disabled={!content.trim() || loading}
              size="sm"
              className="bg-campus-orange hover:bg-campus-orange/90 text-primary-foreground"
            >
              <Send size={14} className="mr-1.5" />
              {loading ? "Posting..." : "Post Anonymously"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
