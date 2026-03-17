import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Bell, User, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

interface BottomNavProps {
  onCreateTap: () => void;
}

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/discover", icon: Compass, label: "Discover" },
  { path: "__create__", icon: Plus, label: "Create" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = ({ onCreateTap }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div className="glass rounded-2xl shadow-elevated flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isCreate = tab.path === "__create__";
            const isActive = !isCreate && location.pathname === tab.path;

            if (isCreate) {
              return (
                <button
                  key="create"
                  onClick={onCreateTap}
                  className="relative flex items-center justify-center -mt-3"
                >
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-glow"
                  >
                    <Plus size={26} className="text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }

            const isNotif = tab.path === "/notifications";

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center w-14 h-full gap-0.5 transition-colors"
              >
                <div className="relative">
                  <tab.icon
                    size={21}
                    className={`transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={isActive ? 2.3 : 1.7}
                  />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavDot"
                    className="absolute -bottom-0 w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
