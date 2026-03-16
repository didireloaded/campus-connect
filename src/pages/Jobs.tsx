import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Briefcase, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Job {
  id: string;
  title: string;
  company: string | null;
  description: string | null;
  job_type: string;
  location: string | null;
  pay: string | null;
  contact_info: string | null;
  status: string;
  created_at: string;
}

export default function Jobs() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("part-time");
  const [location, setLocation] = useState("");
  const [pay, setPay] = useState("");
  const [contact, setContact] = useState("");

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*")
      .eq("status", "open").order("created_at", { ascending: false });
    setJobs((data as Job[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !profile?.university_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("jobs").insert({
      poster_id: user.id, university_id: profile.university_id,
      title: title.trim(), company: company.trim() || null,
      description: description.trim() || null, job_type: jobType,
      location: location.trim() || null, pay: pay.trim() || null,
      contact_info: contact.trim() || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Job posted!");
    setSheetOpen(false);
    setTitle(""); setCompany(""); setDescription(""); setLocation(""); setPay(""); setContact("");
    fetchJobs();
  };

  const typeLabels: Record<string, string> = {
    "part-time": "Part-time", "full-time": "Full-time", "internship": "Internship", "freelance": "Freelance"
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Job Board</h1>
          <p className="text-[10px] text-muted-foreground">Part-time jobs & internships</p>
        </div>
        <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 space-y-3 py-4 pb-20">
        {jobs.map((job) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Briefcase size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-sm">{job.title}</h3>
                {job.company && <p className="text-xs text-primary font-medium">{job.company}</p>}
                {job.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-secondary rounded-full text-[10px] font-semibold text-foreground">
                    {typeLabels[job.job_type] || job.job_type}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin size={8} /> {job.location}
                    </span>
                  )}
                  {job.pay && (
                    <span className="text-[10px] font-semibold text-primary">{job.pay}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-16">
            <Briefcase size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No jobs posted yet</p>
            <p className="text-sm text-muted-foreground">Post a job or internship opportunity</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Post a Job</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
            <Input placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
            <div className="flex gap-2">
              {Object.entries(typeLabels).map(([key, label]) => (
                <button key={key} onClick={() => setJobType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${jobType === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Input placeholder="Pay (e.g. N$50/hr)" value={pay} onChange={(e) => setPay(e.target.value)} />
            <Input placeholder="Contact info" value={contact} onChange={(e) => setContact(e.target.value)} />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">Post Job</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
