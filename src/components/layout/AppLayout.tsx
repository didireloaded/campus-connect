import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, Compass, Bell, User, Plus } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { CreateMenu } from "@/components/create/CreateMenu";
import { cn } from "@/lib/utils";

export const AppLayout = () => {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border-r border-border z-50">
        <div className="p-6">
          <h1 className="text-2xl font-black text-brand-purple tracking-tight uppercase">CampLife</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-4">
          <DesktopNavItem to="/" icon={<Home size={22} />} label="Home" />
          <DesktopNavItem to="/discover" icon={<Compass size={22} />} label="Discover" />
          <DesktopNavItem to="/notifications" icon={<Bell size={22} />} label="Notifications" />
          <DesktopNavItem to="/profile" icon={<User size={22} />} label="Profile" />
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full h-12 bg-brand-purple rounded-2xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-brand-purple/30 hover:opacity-90 transition-all active:scale-95 gap-2"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-background pb-20 md:pb-0">
          <div className="w-full max-w-2xl mx-auto min-h-full bg-card shadow-sm md:border-x md:border-border relative">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <CreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
          <BottomNav onCreateTap={() => setCreateOpen(true)} />
        </div>
      </div>

      {/* Desktop Create Menu */}
      <div className="hidden md:block">
        <CreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </div>
  );
};

function DesktopNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
          isActive
            ? "bg-brand-purple/10 text-brand-purple"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
