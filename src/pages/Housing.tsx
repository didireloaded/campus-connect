import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Clock } from "lucide-react";

export default function Housing() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-full pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-foreground hover:text-foreground/80">
            <ArrowLeft size={20} />
          </button>
          <Home size={18} className="text-primary" />
          <h1 className="text-sm font-bold text-foreground">Housing</h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6">
          <Home size={36} className="text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Housing</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Find sublets, roommates, and off-campus housing near your university. This feature is coming soon!
        </p>
        <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-sm font-bold text-muted-foreground">
          <Clock size={16} />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
