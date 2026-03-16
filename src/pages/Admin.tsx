import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertTriangle, Users, BarChart3, Trash2, Ban, CheckCircle, ArrowLeft, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Report {
  id: string;
  reason: string;
  content_type: string | null;
  content_id: string | null;
  status: string | null;
  created_at: string | null;
  reporter_id: string;
}

interface FlaggedPost {
  id: string;
  content: string | null;
  moderation_status: string;
  moderation_reason: string | null;
  created_at: string | null;
  user_id: string;
}

export default function Admin() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [stats, setStats] = useState({ users: 0, posts: 0, wallPosts: 0, events: 0 });

  useEffect(() => {
    checkAdmin();
  }, [session]);

  const checkAdmin = async () => {
    if (!session?.user?.id) { navigate("/"); return; }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast.error("Access denied: admin only");
      navigate("/");
      return;
    }
    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const [reportsRes, flaggedRes, usersRes, postsRes, wallRes, eventsRes] = await Promise.all([
      supabase.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
      supabase.from("posts").select("id, content, moderation_status, moderation_reason, created_at, user_id").in("moderation_status", ["flagged", "removed"]).limit(50),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("wall_posts").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
    ]);

    setReports((reportsRes.data as Report[]) || []);
    setFlaggedPosts((flaggedRes.data as FlaggedPost[]) || []);
    setStats({
      users: usersRes.count || 0,
      posts: postsRes.count || 0,
      wallPosts: wallRes.count || 0,
      events: eventsRes.count || 0,
    });
    setLoading(false);
  };

  const handleResolveReport = async (id: string, action: "resolved" | "dismissed") => {
    await supabase.from("reports").update({ status: action }).eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Report ${action}`);
  };

  const handleApprovePost = async (id: string) => {
    await supabase.from("posts").update({ moderation_status: "approved", moderation_reason: null }).eq("id", id);
    setFlaggedPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post approved");
  };

  const handleRemovePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    setFlaggedPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post removed");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <Shield size={20} className="text-primary" />
        <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {[
          { label: "Users", value: stats.users, icon: Users, color: "text-primary" },
          { label: "Posts", value: stats.posts, icon: BarChart3, color: "text-emerald-500" },
          { label: "Wall Posts", value: stats.wallPosts, icon: Flag, color: "text-orange-500" },
          { label: "Events", value: stats.events, icon: AlertTriangle, color: "text-purple-500" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border">
            <s.icon size={18} className={s.color} />
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="reports" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="reports" className="flex-1">Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="flagged" className="flex-1">Flagged ({flaggedPosts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-3 mt-3">
          {reports.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No pending reports</p>
          ) : reports.map((r) => (
            <div key={r.id} className="bg-card rounded-xl p-4 border border-border space-y-2">
              <p className="text-sm font-medium text-foreground">{r.reason}</p>
              <p className="text-xs text-muted-foreground">Type: {r.content_type} • {new Date(r.created_at || "").toLocaleDateString()}</p>
              <div className="flex gap-2">
                <button onClick={() => handleResolveReport(r.id, "resolved")}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium">
                  <CheckCircle size={14} /> Resolve
                </button>
                <button onClick={() => handleResolveReport(r.id, "dismissed")}
                  className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium">
                  <Ban size={14} /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-3 mt-3">
          {flaggedPosts.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No flagged posts</p>
          ) : flaggedPosts.map((p) => (
            <div key={p.id} className="bg-card rounded-xl p-4 border border-border space-y-2">
              <p className="text-sm text-foreground line-clamp-3">{p.content}</p>
              <p className="text-xs text-destructive">⚠️ {p.moderation_reason}</p>
              <p className="text-xs text-muted-foreground">Status: {p.moderation_status}</p>
              <div className="flex gap-2">
                <button onClick={() => handleApprovePost(p.id)}
                  className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-lg font-medium">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleRemovePost(p.id)}
                  className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg font-medium">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
