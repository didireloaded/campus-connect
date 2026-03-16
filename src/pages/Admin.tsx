import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, Users, BarChart3, Trash2, Ban, CheckCircle, ArrowLeft, Flag,
  MessageSquare, ShoppingBag, Calendar, TrendingUp, Eye, FileText,
  Car, BookOpen, Vote, Ghost, Briefcase, UserCheck, UserX, RefreshCw,
  Activity, AlertTriangle, Search, ChevronDown, MoreVertical, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

// ── Types ──────────────────────────────────────────────
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

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  university_id: string | null;
  created_at: string | null;
  followers_count: number | null;
  following_count: number | null;
}

interface DailyStat {
  date: string;
  posts: number;
  wallPosts: number;
  events: number;
}

// ── Constants ──────────────────────────────────────────
const PIE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 80%, 50%)",
];

// ── Component ──────────────────────────────────────────
export default function Admin() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Data
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [stats, setStats] = useState({
    users: 0, posts: 0, wallPosts: 0, events: 0,
    listings: 0, stories: 0, confessions: 0, polls: 0,
    rides: 0, studyGroups: 0, jobs: 0, clubs: 0,
    lectureNotes: 0, lostFound: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [contentBreakdown, setContentBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; text: string; time: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailData, setUserDetailData] = useState<{
    posts: number; wallPosts: number; events: number; listings: number;
    roles: string[];
  } | null>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      reportsRes, flaggedRes, usersRes, postsRes, wallRes, eventsRes,
      listingsRes, storiesRes, confessionsRes, pollsRes, ridesRes,
      studyGroupsRes, jobsRes, clubsRes, lectureNotesRes, lostFoundRes,
      profilesRes
    ] = await Promise.all([
      supabase.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
      supabase.from("posts").select("id, content, moderation_status, moderation_reason, created_at, user_id").in("moderation_status", ["flagged", "removed"]).limit(50),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("wall_posts").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }),
      supabase.from("stories").select("id", { count: "exact", head: true }),
      supabase.from("confessions").select("id", { count: "exact", head: true }),
      supabase.from("polls").select("id", { count: "exact", head: true }),
      supabase.from("rides").select("id", { count: "exact", head: true }),
      supabase.from("study_groups").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("clubs").select("id", { count: "exact", head: true }),
      supabase.from("lecture_notes").select("id", { count: "exact", head: true }),
      supabase.from("lost_found").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    const s = {
      users: usersRes.count || 0,
      posts: postsRes.count || 0,
      wallPosts: wallRes.count || 0,
      events: eventsRes.count || 0,
      listings: listingsRes.count || 0,
      stories: storiesRes.count || 0,
      confessions: confessionsRes.count || 0,
      polls: pollsRes.count || 0,
      rides: ridesRes.count || 0,
      studyGroups: studyGroupsRes.count || 0,
      jobs: jobsRes.count || 0,
      clubs: clubsRes.count || 0,
      lectureNotes: lectureNotesRes.count || 0,
      lostFound: lostFoundRes.count || 0,
    };

    setReports((reportsRes.data as Report[]) || []);
    setFlaggedPosts((flaggedRes.data as FlaggedPost[]) || []);
    setUsers((profilesRes.data as UserProfile[]) || []);
    setStats(s);

    // Content breakdown for pie chart
    setContentBreakdown([
      { name: "Posts", value: s.posts },
      { name: "Wall Posts", value: s.wallPosts },
      { name: "Events", value: s.events },
      { name: "Listings", value: s.listings },
      { name: "Confessions", value: s.confessions },
      { name: "Other", value: s.polls + s.rides + s.studyGroups + s.jobs + s.clubs + s.lectureNotes + s.lostFound + s.stories },
    ].filter(c => c.value > 0));

    // Daily stats (last 7 days)
    await loadDailyStats();

    // Recent activity feed
    await loadRecentActivity();

    setLoading(false);
  }, []);

  const loadDailyStats = async () => {
    const days: DailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(subDays(new Date(), i));
      const dayEnd = startOfDay(subDays(new Date(), i - 1));
      const dayLabel = format(dayStart, "EEE");

      const [p, w, e] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString()).lt("created_at", dayEnd.toISOString()),
        supabase.from("wall_posts").select("id", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString()).lt("created_at", dayEnd.toISOString()),
        supabase.from("events").select("id", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString()).lt("created_at", dayEnd.toISOString()),
      ]);

      days.push({ date: dayLabel, posts: p.count || 0, wallPosts: w.count || 0, events: e.count || 0 });
    }
    setDailyStats(days);
  };

  const loadRecentActivity = async () => {
    const [recentPosts, recentWall, recentUsers] = await Promise.all([
      supabase.from("posts").select("id, content, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("wall_posts").select("id, content, created_at, alias").order("created_at", { ascending: false }).limit(5),
      supabase.from("profiles").select("id, username, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const activity: { type: string; text: string; time: string }[] = [];

    (recentPosts.data || []).forEach(p => {
      activity.push({
        type: "post",
        text: `New post: "${(p.content || "").slice(0, 40)}..."`,
        time: p.created_at || "",
      });
    });
    (recentWall.data || []).forEach(w => {
      activity.push({
        type: "wall",
        text: `Wall post by ${w.alias || "Anon"}: "${(w.content || "").slice(0, 35)}..."`,
        time: w.created_at || "",
      });
    });
    (recentUsers.data || []).forEach(u => {
      activity.push({
        type: "user",
        text: `New user joined: @${u.username}`,
        time: u.created_at || "",
      });
    });

    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activity.slice(0, 10));
  };

  const handleResolveReport = async (id: string, action: "resolved" | "dismissed") => {
    await supabase.from("reports").update({ status: action }).eq("id", id);
    setReports(prev => prev.filter(r => r.id !== id));
    toast.success(`Report ${action}`);
  };

  const handleApprovePost = async (id: string) => {
    await supabase.from("posts").update({ moderation_status: "approved", moderation_reason: null }).eq("id", id);
    setFlaggedPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Post approved");
  };

  const handleRemovePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    setFlaggedPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Post removed");
  };

  const openUserDetail = async (user: UserProfile) => {
    setSelectedUser(user);
    const [postsCount, wallCount, eventsCount, listingsCount, rolesRes] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("wall_posts").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("creator_id", user.id),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setUserDetailData({
      posts: postsCount.count || 0,
      wallPosts: wallCount.count || 0,
      events: eventsCount.count || 0,
      listings: listingsCount.count || 0,
      roles: (rolesRes.data || []).map((r: any) => r.role),
    });
  };

  const toggleUserRole = async (userId: string, role: string, hasRole: boolean) => {
    if (hasRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    }
    // Refresh
    if (selectedUser) openUserDetail(selectedUser);
    toast.success(hasRole ? `Removed ${role} role` : `Granted ${role} role`);
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!isAdmin) return null;

  const statCards = [
    { label: "Users", value: stats.users, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Posts", value: stats.posts, icon: FileText, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Wall Posts", value: stats.wallPosts, icon: Ghost, color: "bg-orange-500/10 text-orange-600" },
    { label: "Events", value: stats.events, icon: Calendar, color: "bg-purple-500/10 text-purple-600" },
    { label: "Marketplace", value: stats.listings, icon: ShoppingBag, color: "bg-pink-500/10 text-pink-600" },
    { label: "Stories", value: stats.stories, icon: Eye, color: "bg-cyan-500/10 text-cyan-600" },
    { label: "Confessions", value: stats.confessions, icon: Ghost, color: "bg-red-500/10 text-red-600" },
    { label: "Polls", value: stats.polls, icon: Vote, color: "bg-indigo-500/10 text-indigo-600" },
    { label: "Rides", value: stats.rides, icon: Car, color: "bg-teal-500/10 text-teal-600" },
    { label: "Study Groups", value: stats.studyGroups, icon: BookOpen, color: "bg-amber-500/10 text-amber-600" },
    { label: "Jobs", value: stats.jobs, icon: Briefcase, color: "bg-sky-500/10 text-sky-600" },
    { label: "Clubs", value: stats.clubs, icon: Users, color: "bg-violet-500/10 text-violet-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Shield size={18} className="text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">Admin Dashboard</h1>
                <p className="text-[10px] text-muted-foreground">Campus Pulse Control Center</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { loadData(); toast.success("Refreshed"); }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={16} className={`text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[53px] z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <TabsList className="w-full justify-start gap-0 h-auto p-0 bg-transparent rounded-none overflow-x-auto">
              {[
                { value: "overview", label: "Overview", icon: BarChart3 },
                { value: "users", label: "Users", icon: Users },
                { value: "moderation", label: "Moderation", icon: Flag },
                { value: "activity", label: "Activity", icon: Activity },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {tab.value === "moderation" && (reports.length + flaggedPosts.length) > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-destructive text-destructive-foreground">
                      {reports.length + flaggedPosts.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ═══ OVERVIEW ═══ */}
          <TabsContent value="overview" className="p-4 space-y-6 pb-24">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-xl p-3.5 border border-border hover:shadow-md transition-shadow"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                    <s.icon size={16} />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2 leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-2 bg-card rounded-xl border border-border p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-1">7-Day Activity</h3>
                <p className="text-[10px] text-muted-foreground mb-3">Posts, wall posts & events created</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <defs>
                        <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradWall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5.9%, 90%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(240, 3.8%, 46.1%)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(240, 3.8%, 46.1%)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 100%)",
                          border: "1px solid hsl(240, 5.9%, 90%)",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Area type="monotone" dataKey="posts" stroke="hsl(221, 83%, 53%)" fill="url(#gradPosts)" strokeWidth={2} />
                      <Area type="monotone" dataKey="wallPosts" stroke="hsl(25, 95%, 53%)" fill="url(#gradWall)" strokeWidth={2} />
                      <Area type="monotone" dataKey="events" stroke="hsl(262, 83%, 58%)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-1">Content Mix</h3>
                <p className="text-[10px] text-muted-foreground mb-3">Breakdown by type</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {contentBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 100%)",
                          border: "1px solid hsl(240, 5.9%, 90%)",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {contentBreakdown.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[9px] text-muted-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Quick Alerts */}
            {(reports.length > 0 || flaggedPosts.length > 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertTriangle size={20} className="text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Attention Needed</p>
                  <p className="text-xs text-muted-foreground">
                    {reports.length} pending report{reports.length !== 1 && "s"} and {flaggedPosts.length} flagged post{flaggedPosts.length !== 1 && "s"} require review.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("moderation")}
                  className="text-xs font-medium text-destructive hover:underline shrink-0"
                >
                  Review →
                </button>
              </motion.div>
            )}
          </TabsContent>

          {/* ═══ USERS ═══ */}
          <TabsContent value="users" className="p-4 space-y-4 pb-24">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users by name or username..."
                className="pl-9 h-9 text-sm"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </p>

            <div className="space-y-2">
              {filteredUsers.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openUserDetail(u)}
                  className="bg-card rounded-xl p-3 border border-border flex items-center gap-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {u.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name || u.username}</p>
                    <p className="text-[10px] text-muted-foreground">@{u.username} • {u.followers_count || 0} followers</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {u.created_at ? format(new Date(u.created_at), "MMM d") : "—"}
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ═══ MODERATION ═══ */}
          <TabsContent value="moderation" className="p-4 pb-24">
            <Tabs defaultValue="reports">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="reports" className="flex-1 text-xs">
                  Reports ({reports.length})
                </TabsTrigger>
                <TabsTrigger value="flagged" className="flex-1 text-xs">
                  Flagged Posts ({flaggedPosts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reports" className="space-y-3">
                {reports.length === 0 ? (
                  <EmptyState icon={CheckCircle} text="No pending reports" sub="All reports have been handled" />
                ) : reports.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-card rounded-xl p-4 border border-border space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{r.reason}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Type: <span className="font-medium text-foreground/70">{r.content_type || "unknown"}</span> • {r.created_at ? format(new Date(r.created_at), "MMM d, h:mm a") : "—"}
                        </p>
                      </div>
                      <Flag size={14} className="text-orange-500 shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveReport(r.id, "resolved")}
                        className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        <CheckCircle size={12} /> Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, "dismissed")}
                        className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                      >
                        <Ban size={12} /> Dismiss
                      </button>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="flagged" className="space-y-3">
                {flaggedPosts.length === 0 ? (
                  <EmptyState icon={CheckCircle} text="No flagged posts" sub="Content moderation is clear" />
                ) : flaggedPosts.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card rounded-xl p-4 border border-border space-y-2.5"
                  >
                    <p className="text-sm text-foreground line-clamp-3">{p.content}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                        {p.moderation_status}
                      </span>
                      {p.moderation_reason && (
                        <span className="text-[10px] text-muted-foreground">— {p.moderation_reason}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovePost(p.id)}
                        className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleRemovePost(p.id)}
                        className="flex items-center gap-1.5 text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══ ACTIVITY ═══ */}
          <TabsContent value="activity" className="p-4 space-y-4 pb-24">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity Feed</h3>
            <div className="space-y-1">
              {recentActivity.length === 0 ? (
                <EmptyState icon={Activity} text="No recent activity" sub="Activity will appear here" />
              ) : recentActivity.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    a.type === "post" ? "bg-primary/10 text-primary" :
                    a.type === "wall" ? "bg-orange-500/10 text-orange-600" :
                    "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {a.type === "post" ? <FileText size={12} /> :
                     a.type === "wall" ? <Ghost size={12} /> :
                     <UserCheck size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {a.time ? format(new Date(a.time), "MMM d, h:mm a") : "—"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedUser(null); setUserDetailData(null); }}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">User Details</h3>
                  <button onClick={() => { setSelectedUser(null); setUserDetailData(null); }} className="p-1 rounded-lg hover:bg-muted">
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {selectedUser.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-foreground">{selectedUser.full_name || selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Joined {selectedUser.created_at ? format(new Date(selectedUser.created_at), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                </div>

                {/* User Stats */}
                {userDetailData && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Posts", value: userDetailData.posts },
                        { label: "Events", value: userDetailData.events },
                        { label: "Listings", value: userDetailData.listings },
                        { label: "Followers", value: selectedUser.followers_count || 0 },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-foreground">{s.value}</p>
                          <p className="text-[9px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Roles Management */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Roles</p>
                      <div className="flex gap-2">
                        {["admin", "moderator", "user"].map(role => {
                          const hasRole = userDetailData.roles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => toggleUserRole(selectedUser.id, role, hasRole)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                hasRole
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {hasRole ? "✓ " : ""}{role}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty State Component ──────────────────────────────
function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <Icon size={32} className="mx-auto text-muted-foreground/40 mb-2" />
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
    </div>
  );
}
