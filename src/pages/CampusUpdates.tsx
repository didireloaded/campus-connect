import { useCampusUpdates } from "@/hooks/useCampusUpdates";
import { ArrowLeft, Loader2, Newspaper, AlertTriangle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";

export default function CampusUpdates() {
  const navigate = useNavigate();
  const { updates, loading, markSeen } = useCampusUpdates();

  useEffect(() => { markSeen(); }, [markSeen]);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Newspaper size={14} className="text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Campus Updates</h1>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-9">Official announcements & news</p>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : updates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Newspaper size={28} className="text-primary" />
            </div>
            <p className="font-semibold text-foreground">No updates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Campus news will appear here</p>
          </div>
        ) : (
          updates.map((update, i) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl border border-border p-4 shadow-card"
            >
              {update.image_url && (
                <img src={update.image_url} alt="" className="w-full h-36 object-cover rounded-lg mb-3" loading="lazy" />
              )}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {update.source_type === "alert" ? (
                    <AlertTriangle size={16} className="text-destructive" />
                  ) : (
                    <Newspaper size={16} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{update.title}</h3>
                  {update.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{update.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    {update.source && <span className="font-medium text-primary">{update.source}</span>}
                    <span>{formatDistanceToNow(new Date(update.created_at || update.inserted_at), { addSuffix: true })}</span>
                  </div>
                  {update.source_url && (
                    <a href={update.source_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary font-semibold mt-2">
                      Read more <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
