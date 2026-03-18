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
      <div className="mx-auto max-w-lg px-3 pb-1.5">
        <div className="bg-card border border-border rounded-2xl shadow-elevated flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const isCreate = tab.path === "__create__";
            const isActive = !isCreate && location.pathname === tab.path;

            if (isCreate) {
              return (
                <button key="create" onClick={onCreateTap} className="relative flex items-center justify-center -mt-2.5">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow"
                  >
                    <Plus size={22} className="text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }

            const isNotif = tab.path === "/notifications";

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center w-12 h-full gap-0.5 transition-colors"
              >
                <div className="relative">
                  <tab.icon
                    size={19}
                    className={`transition-colors duration-150 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
