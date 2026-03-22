import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Briefcase } from "lucide-react";

const JOB_TYPES = ["part-time", "full-time", "internship", "gig", "volunteer"];

export default function CreateJob() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [location, setLocation] = useState("");
  const [pay, setPay] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user || !profile?.university_id) return;
    setLoading(true);
    const { error } = await supabase.from("jobs").insert({
      title: title.trim(),
      company: company.trim() || null,
      job_type: jobType,
      location: location.trim() || null,
      pay: pay.trim() || null,
      description: description.trim() || null,
      contact_info: contactInfo.trim() || null,
      poster_id: user.id,
      university_id: profile.university_id,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Job posted!");
    navigate("/jobs");
    setLoading(false);
  };

  return (
    <div className="bg-card min-h-full flex flex-col">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
          <Briefcase size={18} className="text-feature-jobs" />
          <span className="text-sm font-bold text-foreground">Post Job/Gig</span>
        </div>
        <button onClick={handleSubmit} disabled={!title.trim() || loading}
          className="bg-feature-jobs text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Job Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Campus Tour Guide" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Company/Organization</label>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((t) => (
              <button key={t} onClick={() => setJobType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${jobType === t ? "bg-feature-jobs text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="On-campus / Remote / City" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Pay</label>
          <input type="text" value={pay} onChange={(e) => setPay(e.target.value)}
            placeholder="e.g., N$50/hr or Volunteer" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Contact Info</label>
          <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Email or phone" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Job details, requirements..." rows={4}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>
      </div>
    </div>
  );
}
