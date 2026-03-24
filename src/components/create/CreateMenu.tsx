import { useState } from "react";
import { PenLine, CalendarPlus, BarChart3, Ghost, ShoppingBag, BookOpen, FileText, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreatePostSheet } from "./CreatePostSheet";
import { CreateEventSheet } from "./CreateEventSheet";
import { CreateListingSheet } from "./CreateListingSheet";
import { CreatePollSheet } from "./CreatePollSheet";
import { CreateConfessionSheet } from "./CreateConfessionSheet";
import { CreateStudyGroupSheet } from "./CreateStudyGroupSheet";
import { UploadNotesSheet } from "./UploadNotesSheet";
import { CreateRideSheet } from "./CreateRideSheet";

const options = [
  { label: "Post", icon: PenLine, key: "post", hi: true },
  { label: "Event", icon: CalendarPlus, key: "event" },
  { label: "Poll", icon: BarChart3, key: "poll" },
  { label: "Confession", icon: Ghost, key: "confession" },
  { label: "Sell Item", icon: ShoppingBag, key: "listing" },
  { label: "Study Group", icon: BookOpen, key: "studyGroup" },
  { label: "Upload Notes", icon: FileText, key: "notes" },
  { label: "Post Ride", icon: Car, key: "ride" },
];

interface CreateMenuProps {
  open: boolean;
  onClose: () => void;
}

export const CreateMenu = ({ open, onClose }: CreateMenuProps) => {
  const [sheet, setSheet] = useState<string | null>(null);

  const handleAction = (key: string) => {
    onClose();
    setSheet(key);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[22px] shadow-2xl pb-safe max-w-lg mx-auto border-t border-border"
            >
              <div className="flex justify-center pt-3 pb-1.5">
                <div className="w-8 h-[3px] bg-accent rounded-full" />
              </div>
              <div className="px-4 pb-2.5">
                <h3 className="text-sm font-bold text-foreground tracking-tight">What do you want to create?</h3>
              </div>
              <div className="grid grid-cols-4 gap-1 px-3 pb-3">
                {options.map((opt, i) => (
                  <motion.button
                    key={opt.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAction(opt.key)}
                    className="flex flex-col items-center gap-1.5 py-2.5"
                  >
                    <div className={`w-11 h-11 rounded-[14px] border border-border flex items-center justify-center ${
                      opt.hi ? "bg-primary/12 border-primary/20 text-primary" : "bg-accent text-muted-foreground"
                    }`}>
                      <opt.icon size={18} />
                    </div>
                    <span className="text-[9px] font-semibold text-muted-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="px-4 pb-5">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-accent border border-border text-secondary-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreatePostSheet open={sheet === "post"} onClose={() => setSheet(null)} />
      <CreateEventSheet open={sheet === "event"} onClose={() => setSheet(null)} />
      <CreateListingSheet open={sheet === "listing"} onOpenChange={(o) => !o && setSheet(null)} />
      <CreatePollSheet open={sheet === "poll"} onClose={() => setSheet(null)} />
      <CreateConfessionSheet open={sheet === "confession"} onClose={() => setSheet(null)} />
      <CreateStudyGroupSheet open={sheet === "studyGroup"} onClose={() => setSheet(null)} />
      <UploadNotesSheet open={sheet === "notes"} onClose={() => setSheet(null)} />
      <CreateRideSheet open={sheet === "ride"} onClose={() => setSheet(null)} />
    </>
  );
};
