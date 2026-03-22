import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Car, MapPin, Clock, Users } from "lucide-react";

export default function CreateRide() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<"driver" | "rider">("driver");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation.trim() || !toLocation.trim() || !departureTime || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("rides").insert({
      from_location: fromLocation.trim(),
      to_location: toLocation.trim(),
      departure_time: new Date(departureTime).toISOString(),
      seats_available: Number(seats),
      price: price ? Number(price) : 0,
      description: description.trim() || null,
      role,
      user_id: user.id,
      university_id: profile.university_id,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Ride posted!");
    navigate("/rides");
    setLoading(false);
  };

  return (
    <div className="bg-card min-h-full flex flex-col">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
          <Car size={18} className="text-feature-rides" />
          <span className="text-sm font-bold text-foreground">Post Ride</span>
        </div>
        <button onClick={handleSubmit} disabled={!fromLocation.trim() || !toLocation.trim() || !departureTime || loading}
          className="bg-feature-rides text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex gap-2">
          {(["driver", "rider"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${role === r ? "bg-feature-rides text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {r === "driver" ? "🚗 Offering" : "🙋 Looking"}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">From</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)}
              placeholder="Departure location" className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">To</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-feature-rides" />
            <input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)}
              placeholder="Destination" className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Departure Time</label>
          <input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Seats</label>
            <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} min="1" max="8"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Price (N$)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Any additional details..." rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>
      </div>
    </div>
  );
}
