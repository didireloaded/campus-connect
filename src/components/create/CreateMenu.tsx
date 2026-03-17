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
  { label: "Post", icon: PenLine, color: "bg-primary/15 text-primary", key: "post" },
  { label: "Event", icon: CalendarPlus, color: "bg-blue-500/15 text-blue-500", key: "event" },
  { label: "Poll", icon: BarChart3, color: "bg-pink-500/15 text-pink-500", key: "poll" },
  { label: "Confession", icon: Ghost, color: "bg-purple-500/15 text-purple-500", key: "confession" },
  { label: "Sell Item", icon: ShoppingBag, color: "bg-orange-500/15 text-orange-500", key: "listing" },
  { label: "Study Group", icon: BookOpen, color: "bg-blue-500/15 text-blue-500", key: "studyGroup" },
  { label: "Upload Notes", icon: FileText, color: "bg-violet-500/15 text-violet-500", key: "notes" },
  { label: "Post Ride", icon: Car, color: "bg-emerald-500/15 text-emerald-500", key: "ride" },
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
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl pb-safe max-w-lg mx-auto"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>
              <div className="px-5 pb-2">
                <h3 className="text-base font-bold text-foreground">What do you want to create?</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 px-5 pb-4">
                {options.map((opt, i) => (
                  <motion.button
                    key={opt.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAction(opt.key)}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${opt.color} flex items-center justify-center`}>
                      <opt.icon size={22} />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="px-5 pb-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold"
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
