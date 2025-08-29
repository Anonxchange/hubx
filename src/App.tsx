import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load heavy components
const Index = lazy(() => import('./pages/Index'));
const VideoPage = lazy(() => import('./pages/VideoPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const StudioDashboard = lazy(() => import('./pages/StudioDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

import AgeGateWrapper from "./components/AgeGateWrapper";
import CategoryPage from "./pages/CategoryPage";
import AllCategoriesPage from "./pages/AllCategoriesPage";
import MomentsPage from "./pages/MomentsPage";
import RecommendedPage from "./pages/RecommendedPage";
import FeaturedPage from "./pages/FeaturedPage";
import MostLikedPage from "./pages/MostLikedPage";
import HottestPage from './pages/HottestPage';
import TrendingPage from './pages/TrendingPage';
import PremiumPage from "./pages/PremiumPage";
import PremiumVRPage from './pages/PremiumVRPage';
import PremiumCategoryPage from '@/pages/PremiumCategoryPage';
import PremiumVideoPage from './pages/PremiumVideoPage';
import PremiumStudioCreatorsPage from './pages/PremiumStudioCreatorsPage';
import PremiumIndividualCreatorsPage from './pages/PremiumIndividualCreatorsPage';
import ContactUs from "./pages/ContactUs";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import BecomeModelPage from "@/pages/BecomeModelPage";
import FAQPage from "@/pages/FAQPage";
import UploadPage from './pages/UploadPage';
import DebugAuth from './pages/DebugAuth';
import ChannelPage from '@/pages/ChannelPage';
import PlaylistsPage from './pages/PlaylistsPage';
import ReportVideoPage from '@/pages/ReportVideoPage';
import FavoritesPage from '@/pages/FavoritesPage';
import FeedPage from '@/pages/FeedPage.tsx';
import NotificationsPage from '@/pages/NotificationsPage';
import InboxPage from '@/pages/InboxPage';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from '@/contexts/LanguageContext';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Router>
              <AgeGateWrapper>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/video/:id" element={<VideoPage />} />
                  <Route path="/category/:category" element={<CategoryPage />} />
                  <Route path="/categories" element={<AllCategoriesPage />} />
                  <Route path="/moments" element={<MomentsPage />} />
                  <Route path="/channel" element={<ChannelPage />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/report/:videoId" element={<ReportVideoPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/recommended" element={<RecommendedPage />} />
                  <Route path="/featured" element={<FeaturedPage />} />
                  <Route path="/most-liked" element={<MostLikedPage />} />
                  <Route path="/hottest" element={<HottestPage />} />
                  <Route path="/hottest/:country" element={<HottestPage />} />
                  <Route path="/trending" element={<TrendingPage />} />
                  <Route path="/premium" element={<PremiumPage />} />
                  <Route path="/premium/video/:id" element={<PremiumVideoPage />} />
                  <Route path="/premium/categories/:category" element={<PremiumCategoryPage />} />
                  <Route path="/premium/vr" element={<PremiumVRPage />} />
                  <Route path="/premium/creators/individual" element={<PremiumIndividualCreatorsPage />} />
                  <Route path="/premium/creators/studio" element={<PremiumStudioCreatorsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:username?" element={<ProfilePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/become-model" element={<BecomeModelPage />} />
                  <Route path="/playlists" element={<PlaylistsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/feed" element={<FeedPage />} />

                  {/* Protected Creator Dashboard */}
                  <Route
                    path="/creator-dashboard"
                    element={
                      <ProtectedRoute allowedUserTypes={['individual_creator', 'studio_creator']}>
                        <CreatorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* Protected Studio Dashboard */}
                  <Route
                    path="/studio-dashboard"
                    element={
                      <ProtectedRoute allowedUserTypes={['studio_creator']}>
                        <StudioDashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* Protected Upload Page */}
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute allowedUserTypes={['individual_creator', 'studio_creator']}>
                        <UploadPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/admin-hubx-2024" element={<AdminPanel />} />
                  <Route path="/debug-auth" element={<DebugAuth />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AgeGateWrapper>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;