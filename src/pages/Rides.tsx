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
  created_at: string;
}

export default function Rides() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("0");

  const fetchRides = async () => {
    const { data } = await supabase.from("rides").select("*")
      .gte("departure_time", new Date().toISOString())
      .eq("status", "open")
      .order("departure_time", { ascending: true });
    setRides((data as Ride[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRides(); }, []);

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
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Ride posted!");
    setSheetOpen(false); setFrom(""); setTo(""); setTime(""); setSeats("1"); setPrice("0");
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

      <div className="px-4 space-y-3 py-4 pb-20">
        {rides.map((ride) => (
          <motion.div key={ride.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Car size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{ride.from_location} → {ride.to_location}</p>
              </div>
              {ride.price > 0 && (
                <span className="text-sm font-bold text-primary">N${ride.price}</span>
              )}
            </div>
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
          <SheetHeader><SheetTitle>Offer a Ride</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
            <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
            <div className="flex gap-3">
              <Input type="number" placeholder="Seats" value={seats} onChange={(e) => setSeats(e.target.value)} min="1" />
              <Input type="number" placeholder="Price (N$)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />
            </div>
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Post Ride</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
