import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreatePostSheet = ({ open, onClose }: Props) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePost = async () => {
    if ((!content.trim() && !imageFile) || !user || !profile?.university_id) return;
    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("posts")
          .upload(path, imageFile, { upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      await postService.createPost({
        userId: user.id,
        universityId: profile.university_id,
        content: content.trim(),
        imageUrl,
      });

      toast.success("Posted to campus feed! 🎉");
      setContent("");
      removeImage();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const canPost = (content.trim().length > 0 || !!imageFile) && !loading;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto pb-safe">
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

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-xl"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary"
              type="button"
            >
              <ImagePlus size={22} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button onClick={handlePost} disabled={!canPost} size="sm">
              {loading ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Send size={14} className="mr-1.5" />
              )}
              {loading ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
