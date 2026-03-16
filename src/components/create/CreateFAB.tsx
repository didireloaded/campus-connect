import { useState } from "react";
import { Plus, X, PenLine, Ghost, CalendarPlus, Camera, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreatePostSheet } from "./CreatePostSheet";
import { CreateWallPostSheet } from "./CreateWallPostSheet";
import { CreateEventSheet } from "./CreateEventSheet";
import { CreateListingSheet } from "./CreateListingSheet";

const actions = [
  { icon: PenLine, label: "Post to Feed", color: "bg-primary", key: "post" },
  { icon: Ghost, label: "Post to Wall", color: "bg-campus-orange", key: "wall" },
  { icon: CalendarPlus, label: "Create Event", color: "bg-campus-green", key: "event" },
  { icon: ShoppingBag, label: "Sell Something", color: "bg-campus-purple", key: "listing" },
  { icon: Camera, label: "Add Story", color: "bg-destructive", key: "story" },
];

export const CreateFAB = () => {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);

  const handleAction = (key: string) => {
    setOpen(false);
    if (key === "story") return;
    setSheet(key);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-50" onClick={() => setOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3 max-w-lg">
            {actions.map((action, i) => (
              <motion.button key={action.key}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => handleAction(action.key)}
                className="flex items-center gap-3"
              >
                <span className="bg-card shadow-elevated rounded-full px-3 py-1.5 text-sm font-medium text-foreground">{action.label}</span>
                <div className={`${action.color} w-11 h-11 rounded-full flex items-center justify-center shadow-elevated`}>
                  <action.icon size={20} className="text-primary-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => setOpen(!open)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="fixed bottom-[4.5rem] right-4 z-50 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-modal max-w-lg"
      >
        {open ? <X size={24} className="text-primary-foreground" /> : <Plus size={24} className="text-primary-foreground" />}
      </motion.button>

      <CreatePostSheet open={sheet === "post"} onClose={() => setSheet(null)} />
      <CreateWallPostSheet open={sheet === "wall"} onClose={() => setSheet(null)} />
      <CreateEventSheet open={sheet === "event"} onClose={() => setSheet(null)} />
      <CreateListingSheet open={sheet === "listing"} onOpenChange={(o) => !o && setSheet(null)} />
    </>
  );
};
