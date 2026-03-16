import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Send } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateEventSheet = ({ open, onClose }: Props) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title || !eventDate || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("events").insert({
      creator_id: user.id,
      university_id: profile.university_id,
      title,
      description: description || null,
      event_date: eventDate,
      location_name: locationName || null,
    });
    if (error) toast.error("Failed to create event");
    else {
      toast.success("Event created!");
      setTitle(""); setDescription(""); setEventDate(""); setLocationName("");
      onClose();
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader>
          <SheetTitle className="text-left flex items-center gap-2">
            <CalendarDays size={18} className="text-campus-green" />
            Create Event
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Event Title</Label>
            <Input placeholder="What's happening?" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea placeholder="Tell people more..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 resize-none min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Date & Time</Label>
              <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input placeholder="Where?" value={locationName} onChange={(e) => setLocationName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!title || !eventDate || loading} className="w-full">
            <Send size={14} className="mr-1.5" />
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
