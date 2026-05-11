import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Image, Loader2, AlertTriangle } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BG_COLORS = ["#111111", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560", "#c9a96e"];

export function CreateStorySheet({ open, onOpenChange }: CreateStorySheetProps) {
  const { uploadStory } = useStories();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const hasUniversity = !!profile?.university_id;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [bgColor, setBgColor] = useState("#111111");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!hasUniversity) {
      toast.error("Set your campus in your profile before posting a story.");
      return;
    }
    if (!file) {
      toast.error("Select an image or video");
      return;
    }
    setLoading(true);
    try {
      await uploadStory(file, caption, 24, bgColor);
      onOpenChange(false);
      setFile(null);
      setPreview(null);
      setCaption("");
    } catch (err: any) {
      toast.error(err.message || "Failed to post story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-card border-border max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-foreground">New Story</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {!hasUniversity && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle size={18} className="text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-foreground font-medium">Pick your campus first</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Stories are scoped to your university. Add it in your profile to post.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto mt-1 text-primary"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/profile");
                  }}
                >
                  Go to profile →
                </Button>
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={!hasUniversity}
          />

          {preview ? (
            <div className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-[300px] mx-auto" style={{ backgroundColor: bgColor }}>
              {file?.type.startsWith("video") ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[200px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
            >
              <Camera size={32} />
              <span className="text-sm">Tap to add photo or video</span>
            </button>
          )}

          {preview && (
            <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} className="w-full">
              <Image size={16} className="mr-2" /> Change media
            </Button>
          )}

          <div>
            <Label className="text-muted-foreground text-xs">Caption (optional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={200}
              className="bg-secondary border-border"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs mb-2 block">Background Color</Label>
            <div className="flex gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === c ? "border-primary scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading || !file || !hasUniversity} className="w-full bg-primary text-primary-foreground">
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Post Story
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
