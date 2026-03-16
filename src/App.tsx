import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Wall from "./pages/Wall";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import MapPage from "./pages/MapPage";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import LostFound from "./pages/LostFound";
import Rides from "./pages/Rides";
import StudyGroups from "./pages/StudyGroups";
import LectureNotes from "./pages/LectureNotes";
import Polls from "./pages/Polls";
import Confessions from "./pages/Confessions";
import Jobs from "./pages/Jobs";
import Clubs from "./pages/Clubs";
import Explore from "./pages/Explore";
import StoryViewer from "./pages/StoryViewer";
import EventDetail from "./pages/EventDetail";
import UserProfilePage from "./pages/UserProfilePage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
      <Route path="/rides" element={<ProtectedRoute><Rides /></ProtectedRoute>} />
      <Route path="/study-groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
      <Route path="/lecture-notes" element={<ProtectedRoute><LectureNotes /></ProtectedRoute>} />
      <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
      <Route path="/confessions" element={<ProtectedRoute><Confessions /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
      <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
      <Route path="/story" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
      <Route path="/event-detail" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Index />} />
        <Route path="/wall" element={<Wall />} />
        <Route path="/events" element={<Events />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
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
