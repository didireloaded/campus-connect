import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateRideSheet = ({ open, onClose }: Props) => {
  const { profile } = useAuth();
  const [role, setRole] = useState<"driver" | "passenger">("driver");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("0");
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!from.trim() || !to.trim() || !time || !profile?.university_id) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from("rides").insert({
      user_id: user.id,
      university_id: profile.university_id,
      from_location: from.trim(),
      to_location: to.trim(),
      departure_time: new Date(time).toISOString(),
      seats_available: parseInt(seats) || 1,
      price: parseFloat(price) || 0,
      role,
      vehicle_desc: role === "driver" ? vehicleDesc.trim() || null : null,
    } as any);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Ride posted!");
    setFrom(""); setTo(""); setTime(""); setSeats("1"); setPrice("0"); setVehicleDesc(""); setLoading(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader><SheetTitle>Post a Ride</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          {/* Role toggle */}
          <div className="flex bg-secondary rounded-xl p-1">
            {(["driver", "passenger"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {r === "driver" ? "🚗 Driver" : "🙋 Passenger"}
              </button>
            ))}
          </div>
          <Input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
          <div className="flex gap-3">
            <Input type="number" placeholder={role === "driver" ? "Seats" : "Needed"} value={seats} onChange={(e) => setSeats(e.target.value)} min="1" />
            <Input type="number" placeholder="Price (N$)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />
          </div>
          {role === "driver" && (
            <Input placeholder="Vehicle (e.g. Silver Honda Civic)" value={vehicleDesc} onChange={(e) => setVehicleDesc(e.target.value)} />
          )}
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Post Ride"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
