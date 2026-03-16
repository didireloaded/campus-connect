import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { CreateFAB } from "@/components/create/CreateFAB";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-16">
        <Outlet />
      </main>
      <CreateFAB />
      <BottomNav />
    </div>
  );
};
