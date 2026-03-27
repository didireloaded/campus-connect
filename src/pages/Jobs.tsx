import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Briefcase, MapPin, DollarSign, Building2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

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

const TYPE_STYLES: Record<string, string> = {
  "part-time": "bg-[hsl(var(--feature-studygroups))]/10 text-[hsl(var(--feature-studygroups))]",
  "full-time": "bg-[hsl(var(--feature-marketplace))]/10 text-[hsl(var(--feature-marketplace))]",
  "internship": "bg-[hsl(var(--feature-notes))]/10 text-[hsl(var(--feature-notes))]",
  "freelance": "bg-[hsl(var(--feature-spotted))]/10 text-[hsl(var(--feature-spotted))]",
};

export default function Jobs() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("part-time");
  const [location, setLocation] = useState("");
  const [pay, setPay] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    if (!profile?.university_id) return;

    const fetchJobs = async () => {
      const { data } = await supabase.from("jobs").select("*")
        .eq("university_id", profile.university_id)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      setJobs((data as Job[]) || []);
      setLoading(false);
    };

    fetchJobs();

    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "jobs",
        filter: `university_id=eq.${profile.university_id}`,
      }, () => fetchJobs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.university_id]);

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
  };

  const typeLabels: Record<string, string> = {
    "all": "All", "part-time": "Part-time", "full-time": "Full-time", "internship": "Internship", "freelance": "Freelance"
  };

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.job_type === filter);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Professional header */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--feature-jobs))]/15 flex items-center justify-center">
                <Briefcase size={14} className="text-[hsl(var(--feature-jobs))]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Job Board</h1>
            </div>
          </div>
          <button onClick={() => setSheetOpen(true)} className="w-9 h-9 bg-[hsl(var(--feature-jobs))] rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* Type filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {Object.entries(typeLabels).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              filter === key
                ? "bg-[hsl(var(--feature-jobs))] text-white"
                : "bg-card border border-border text-muted-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Professional listing cards */}
      <div className="px-4 space-y-2.5 pb-20">
        {filtered.map((job, i) => (
          <motion.div key={job.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              {/* Company icon */}
              <div className="w-11 h-11 rounded-xl bg-[hsl(var(--feature-jobs))]/10 flex items-center justify-center shrink-0">
                {job.company ? <Building2 size={18} className="text-[hsl(var(--feature-jobs))]" /> : <Briefcase size={18} className="text-[hsl(var(--feature-jobs))]" />}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title - bold, prominent */}
                <h3 className="font-bold text-foreground text-sm">{job.title}</h3>

                {/* Company name */}
                {job.company && <p className="text-xs text-muted-foreground font-medium mt-0.5">{job.company}</p>}

                {/* Description */}
                {job.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{job.description}</p>}

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${TYPE_STYLES[job.job_type] || "bg-secondary text-muted-foreground"}`}>
                    {typeLabels[job.job_type] || job.job_type}
                  </span>
                  {job.pay && (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[hsl(var(--feature-jobs))]">
                      <DollarSign size={10} /> {job.pay}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin size={9} /> {job.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with apply action */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
              {job.contact_info && (
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[hsl(var(--feature-jobs))]/10 text-[hsl(var(--feature-jobs))] text-[11px] font-semibold">
                  <ExternalLink size={11} /> Apply
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--feature-jobs))]/10 flex items-center justify-center mx-auto mb-3">
              <Briefcase size={28} className="text-[hsl(var(--feature-jobs))]" />
            </div>
            <p className="font-semibold text-foreground">No jobs posted yet</p>
            <p className="text-xs text-muted-foreground mt-1">Post a job or internship opportunity</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Post a Job</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
            <Input placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <div className="flex gap-2 flex-wrap">
              {Object.entries(typeLabels).filter(([k]) => k !== "all").map(([key, label]) => (
                <button key={key} onClick={() => setJobType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    jobType === key ? "bg-[hsl(var(--feature-jobs))] text-white" : "bg-secondary text-muted-foreground"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <Textarea placeholder="Job description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-secondary border-0 resize-none" />
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="Pay (e.g. N$50/hr)" value={pay} onChange={(e) => setPay(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <Input placeholder="Contact info (email or phone)" value={contact} onChange={(e) => setContact(e.target.value)} className="rounded-xl bg-secondary border-0" />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-[hsl(var(--feature-jobs))] text-white font-semibold">Post Job</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
