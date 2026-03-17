import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Car, MapPin, Clock, Users } from "lucide-react";
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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Ride Share</h1>
          <p className="text-[10px] text-muted-foreground">Share rides with campus mates</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      {/* Filter */}
      <div className="px-4 py-2 flex gap-2">
        {(["all", "driver", "passenger"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {f === "all" ? "All" : f === "driver" ? "🚗 Drivers" : "🙋 Passengers"}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 py-2 pb-20">
        {rides.map((ride) => (
          <motion.div key={ride.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ride.role === "driver" ? "bg-primary/10" : "bg-orange-500/10"}`}>
                <Car size={16} className={ride.role === "driver" ? "text-primary" : "text-orange-500"} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{ride.from_location} → {ride.to_location}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ride.role === "driver" ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-500"}`}>
                  {ride.role === "driver" ? "Driver" : "Passenger"}
                </span>
              </div>
              {ride.price > 0 && <span className="text-sm font-bold text-primary">N${ride.price}</span>}
            </div>
            {ride.vehicle_desc && (
              <p className="text-xs text-muted-foreground mb-1">🚘 {ride.vehicle_desc}</p>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(ride.departure_time), "MMM d, h:mm a")}</span>
              <span className="flex items-center gap-1"><Users size={10} /> {ride.seats_available} seats</span>
            </div>
          </motion.div>
        ))}
        {!loading && rides.length === 0 && (
          <div className="text-center py-16">
            <Car size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No rides available</p>
            <p className="text-sm text-muted-foreground">Offer a ride to get started</p>
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
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {r === "driver" ? "🚗 Driver" : "🙋 Passenger"}
                </button>
              ))}
            </div>
            <Input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
            <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
            <div className="flex gap-3">
              <Input type="number" placeholder="Seats" value={seats} onChange={(e) => setSeats(e.target.value)} min="1" />
              <Input type="number" placeholder="Price (N$)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />
            </div>
            {role === "driver" && (
              <Input placeholder="Vehicle (e.g. Silver Honda Civic)" value={vehicleDesc} onChange={(e) => setVehicleDesc(e.target.value)} />
            )}
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Post Ride</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
