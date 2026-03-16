import { useState } from "react";
import { PenLine, Ghost, CalendarPlus, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreatePostSheet } from "./CreatePostSheet";
import { CreateWallPostSheet } from "./CreateWallPostSheet";
import { CreateEventSheet } from "./CreateEventSheet";

const actions = [
  { icon: PenLine, label: "Create Post", color: "bg-primary", key: "post" },
  { icon: Ghost, label: "Create Wall Post", color: "bg-orange-500", key: "wall" },
  { icon: CalendarPlus, label: "Create Event", color: "bg-emerald-500", key: "event" },
  { icon: Camera, label: "Upload Story", color: "bg-destructive", key: "story" },
];

interface CreateMenuProps {
  open: boolean;
  onClose: () => void;
}

export const CreateMenu = ({ open, onClose }: CreateMenuProps) => {
  const [sheet, setSheet] = useState<string | null>(null);

  const handleAction = (key: string) => {
    onClose();
    if (key === "story") return;
    setSheet(key);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 max-w-lg">
            {actions.map((action, i) => (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => handleAction(action.key)}
                className="flex items-center gap-3"
              >
                <div className={`${action.color} w-11 h-11 rounded-full flex items-center justify-center shadow-lg`}>
                  <action.icon size={20} className="text-white" />
                </div>
                <span className="bg-card shadow-lg rounded-full px-4 py-2 text-sm font-semibold text-foreground">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <CreatePostSheet open={sheet === "post"} onClose={() => setSheet(null)} />
      <CreateWallPostSheet open={sheet === "wall"} onClose={() => setSheet(null)} />
      <CreateEventSheet open={sheet === "event"} onClose={() => setSheet(null)} />
    </>
  );
};
