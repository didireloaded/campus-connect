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
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            Camp<span className="text-primary">Life</span>
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-4">
          <DesktopNavItem to="/" icon={<Home size={20} />} label="Home" />
          <DesktopNavItem to="/discover" icon={<Compass size={20} />} label="Discover" />
          <DesktopNavItem to="/notifications" icon={<Bell size={20} />} label="Notifications" />
          <DesktopNavItem to="/profile" icon={<User size={20} />} label="Profile" />
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full h-11 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 gap-2 text-sm"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-background pb-20 md:pb-0">
          <div className="w-full max-w-2xl mx-auto min-h-full bg-background relative">
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
          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
