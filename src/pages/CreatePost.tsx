import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, MapPin, Image as ImageIcon } from "lucide-react";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      university_id: profile.university_id,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Post created!");
    navigate("/");
    setLoading(false);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="bg-background min-h-full flex flex-col">
      <div className="sticky top-0 z-20 glass px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="bg-brand-purple text-primary-foreground px-6 py-2 rounded-full text-sm font-black disabled:opacity-50 shadow-md shadow-brand-purple/20 hover:opacity-90 transition-all active:scale-95"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Post"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col bg-card m-2 rounded-[2rem] shadow-sm border border-border">
        <div className="flex gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-brand-purple font-black text-lg overflow-hidden flex-shrink-0 border border-border">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening on campus?"
            className="w-full bg-transparent border-none outline-none resize-none text-lg font-medium text-foreground placeholder:text-muted-foreground min-h-[200px] pt-2"
            autoFocus
          />
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
          <button className="flex items-center gap-2 px-4 h-12 rounded-2xl bg-secondary text-foreground hover:bg-accent transition-colors flex-shrink-0 font-bold text-sm">
            <ImageIcon size={18} strokeWidth={2.5} className="text-brand-orange" />
            Add Image
          </button>
          <button className="flex items-center gap-2 px-4 h-12 rounded-2xl bg-secondary text-foreground hover:bg-accent transition-colors flex-shrink-0 font-bold text-sm">
            <MapPin size={18} strokeWidth={2.5} className="text-primary" />
            Tag Location
          </button>
        </div>
      </div>
    </div>
  );
}
