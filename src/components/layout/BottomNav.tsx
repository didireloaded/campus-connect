import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Bell, User, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

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
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="mx-auto max-w-lg">
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-[2rem] shadow-elevated flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isCreate = tab.path === "__create__";
            const isActive = !isCreate && location.pathname === tab.path;

            if (isCreate) {
              return (
                <div key="create" className="relative -top-5">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onCreateTap}
                    className="w-14 h-14 bg-gradient-to-tr from-brand-purple to-brand-orange rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-purple/40 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={28} strokeWidth={3} />
                  </motion.button>
                </div>
              );
            }

            const isNotif = tab.path === "/notifications";

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-all duration-200",
                  isActive ? "text-brand-purple scale-110" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("relative", isActive && "drop-shadow-md")}>
                  <tab.icon size={24} strokeWidth={isActive ? 2.2 : 1.6} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-orange rounded-full" />
                  )}
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
