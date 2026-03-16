import { useLocation, useNavigate } from "react-router-dom";
import { Home, Flame, CalendarDays, User, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  onCreateTap: () => void;
}

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/wall", icon: Flame, label: "Wall" },
  { path: "__create__", icon: Plus, label: "Create" },
  { path: "/events", icon: CalendarDays, label: "Events" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = ({ onCreateTap }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl safe-bottom border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isCreate = tab.path === "__create__";
          const isActive = !isCreate && location.pathname === tab.path;

          if (isCreate) {
            return (
              <button
                key="create"
                onClick={onCreateTap}
                className="relative flex items-center justify-center -mt-5"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Plus size={26} className="text-primary-foreground" strokeWidth={2.5} />
                </motion.div>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={isActive ? "text-primary" : "text-muted-foreground"}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
