import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

// Eager: landing/auth (rendered first paint)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy: everything else — split per-route to shrink initial bundle
const Wall = lazy(() => import("./pages/Wall"));
const Events = lazy(() => import("./pages/Events"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const LostFound = lazy(() => import("./pages/LostFound"));
const Rides = lazy(() => import("./pages/Rides"));
const StudyGroups = lazy(() => import("./pages/StudyGroups"));
const LectureNotes = lazy(() => import("./pages/LectureNotes"));
const Polls = lazy(() => import("./pages/Polls"));
const Confessions = lazy(() => import("./pages/Confessions"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Clubs = lazy(() => import("./pages/Clubs"));
const Explore = lazy(() => import("./pages/Explore"));
const Spotted = lazy(() => import("./pages/Spotted"));
const StoryViewer = lazy(() => import("./pages/StoryViewer"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const StudyGroupDetail = lazy(() => import("./pages/StudyGroupDetail"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const CampusUpdates = lazy(() => import("./pages/CampusUpdates"));
const Messages = lazy(() => import("./pages/Messages"));
const ChatDetail = lazy(() => import("./pages/ChatDetail"));
const Housing = lazy(() => import("./pages/Housing"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const CreateMarketplace = lazy(() => import("./pages/CreateMarketplace"));
const CreateLostFound = lazy(() => import("./pages/CreateLostFound"));
const CreateNotes = lazy(() => import("./pages/CreateNotes"));
const CreateJob = lazy(() => import("./pages/CreateJob"));
const CreateRide = lazy(() => import("./pages/CreateRide"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="animate-spin text-primary" size={28} />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
        <Route path="/rides" element={<ProtectedRoute><Rides /></ProtectedRoute>} />
        <Route path="/study-groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
        <Route path="/study-group" element={<ProtectedRoute><StudyGroupDetail /></ProtectedRoute>} />
        <Route path="/lecture-notes" element={<ProtectedRoute><LectureNotes /></ProtectedRoute>} />
        <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
        <Route path="/confessions" element={<ProtectedRoute><Confessions /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
        <Route path="/spotted" element={<ProtectedRoute><Spotted /></ProtectedRoute>} />
        <Route path="/wall" element={<ProtectedRoute><Wall /></ProtectedRoute>} />
        <Route path="/story" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
        <Route path="/event-detail" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="/campus-updates" element={<ProtectedRoute><CampusUpdates /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
        <Route path="/housing" element={<ProtectedRoute><Housing /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

        {/* Full-page create forms */}
        <Route path="/create/post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/create/marketplace" element={<ProtectedRoute><CreateMarketplace /></ProtectedRoute>} />
        <Route path="/create/lost-found" element={<ProtectedRoute><CreateLostFound /></ProtectedRoute>} />
        <Route path="/create/notes" element={<ProtectedRoute><CreateNotes /></ProtectedRoute>} />
        <Route path="/create/job" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
        <Route path="/create/ride" element={<ProtectedRoute><CreateRide /></ProtectedRoute>} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Index />} />
          <Route path="/discover" element={<Explore />} />
          <Route path="/events" element={<Events />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
