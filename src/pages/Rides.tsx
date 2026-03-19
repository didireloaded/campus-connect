import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Car, MapPin, Clock, Users, ArrowRight, CircleDot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";

interface Ride {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  seats_available: number;
  price: number;
  description: string | null;
  status: string;
  role: string;
  vehicle_desc: string | null;
  created_at: string;
}

export default function Rides() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState<"driver" | "passenger">("driver");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("0");
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [filter, setFilter] = useState<"all" | "driver" | "passenger">("all");

  const fetchRides = async () => {
    let query = supabase.from("rides").select("*")
      .gte("departure_time", new Date().toISOString())
      .eq("status", "open")
      .order("departure_time", { ascending: true });
    if (filter !== "all") query = query.eq("role", filter);
    const { data } = await query;
    setRides((data as Ride[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRides(); }, [filter]);

  const handleCreate = async () => {
    if (!from.trim() || !to.trim() || !time || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("rides").insert({
      user_id: user.id, university_id: profile.university_id,
      from_location: from.trim(), to_location: to.trim(),
      departure_time: new Date(time).toISOString(),
      seats_available: parseInt(seats) || 1,
      price: parseFloat(price) || 0,
      role,
      vehicle_desc: role === "driver" ? vehicleDesc.trim() || null : null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Ride posted!");
    setSheetOpen(false); setFrom(""); setTo(""); setTime(""); setSeats("1"); setPrice("0"); setVehicleDesc("");
    fetchRides();
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-rides))]/15 flex items-center justify-center">
                <Car size={14} className="text-[hsl(var(--feature-rides))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Ride Share</h1>
            </div>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-rides))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* Filter */}
      <div className="px-4 py-3 flex gap-2">
        {(["all", "driver", "passenger"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? "bg-[hsl(var(--feature-rides))]/10 text-[hsl(var(--feature-rides))] border border-[hsl(var(--feature-rides))]/30"
                : "bg-card border border-border text-muted-foreground"
            }`}>
            {f === "all" ? "All Rides" : f === "driver" ? "🚗 Drivers" : "🙋 Looking"}
          </button>
        ))}
      </div>

      {/* Route-style cards */}
      <div className="px-4 space-y-3 pb-20">
        {rides.map((ride, i) => (
          <motion.div key={ride.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
          >
            {/* Route visualization */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  ride.role === "driver"
                    ? "bg-[hsl(var(--feature-rides))]/10 text-[hsl(var(--feature-rides))]"
                    : "bg-[hsl(var(--feature-spotted))]/10 text-[hsl(var(--feature-spotted))]"
                }`}>
                  {ride.role === "driver" ? "🚗 Driver" : "🙋 Passenger"}
                </span>
                {ride.price > 0 && (
                  <span className="ml-auto text-sm font-bold text-[hsl(var(--feature-rides))]">N${ride.price}</span>
                )}
              </div>

              {/* Route line */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <CircleDot size={14} className="text-[hsl(var(--feature-rides))]" />
                  <div className="w-0.5 h-8 bg-border my-1" />
                  <MapPin size={14} className="text-destructive" />
                </div>
                <div className="flex-1 space-y-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">FROM</p>
                    <p className="text-sm font-semibold text-foreground">{ride.from_location}</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] text-muted-foreground font-medium">TO</p>
                    <p className="text-sm font-semibold text-foreground">{ride.to_location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta bar */}
            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-secondary/50">
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {format(new Date(ride.departure_time), "MMM d, h:mm a")}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} /> {ride.seats_available} seat{ride.seats_available !== 1 ? "s" : ""}
                </span>
              </div>
              {ride.vehicle_desc && (
                <span className="text-[10px] text-muted-foreground">🚘 {ride.vehicle_desc}</span>
              )}
            </div>
          </motion.div>
        ))}
        {!loading && rides.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-rides))]/10 flex items-center justify-center mx-auto mb-3">
              <Car size={28} className="text-[hsl(var(--feature-rides))]" />
            </div>
            <p className="font-semibold text-foreground">No rides available</p>
            <p className="text-xs text-muted-foreground mt-1">Post a ride to get started</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Post a Ride</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <div className="flex bg-secondary rounded-xl p-1">
              {(["driver", "passenger"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    role === r ? "bg-[hsl(var(--feature-rides))] text-white" : "text-muted-foreground"
                  }`}>
                  {r === "driver" ? "🚗 Driver" : "🙋 Passenger"}
                </button>
              ))}
            </div>
            <Input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <div className="flex gap-3">
              <Input type="number" placeholder="Seats" value={seats} onChange={(e) => setSeats(e.target.value)} min="1" className="rounded-xl bg-secondary border-0" />
              <Input type="number" placeholder="Price (N$)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" className="rounded-xl bg-secondary border-0" />
            </div>
            {role === "driver" && (
              <Input placeholder="Vehicle (e.g. Silver Honda Civic)" value={vehicleDesc} onChange={(e) => setVehicleDesc(e.target.value)} className="rounded-xl bg-secondary border-0" />
            )}
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-[hsl(var(--feature-rides))] text-white font-semibold">Post Ride</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
