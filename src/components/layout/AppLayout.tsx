import { useState } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { CreateMenu } from "@/components/create/CreateMenu";

export const AppLayout = () => {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-16">
        <Outlet />
      </main>
      <CreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
      <BottomNav onCreateTap={() => setCreateOpen(true)} />
    </div>
  );
};
