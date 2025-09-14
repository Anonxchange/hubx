import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react'; // <-- add this

// Import pages/components normally
import Index from './pages/Index';
import VideoPage from './pages/VideoPage';
import AuthPage from './pages/AuthPage';
import CreatorDashboard from './pages/CreatorDashboard';
import StudioDashboard from './pages/StudioDashboard';
import AdminPanel from './pages/AdminPanel';
import AgeGateWrapper from "./components/AgeGateWrapper";
import CategoryPage from "./pages/CategoryPage";
import AllCategoriesPage from "./pages/AllCategoriesPage";
import MomentsPage from "./pages/MomentsPage";
import UserMomentsPage from '@/pages/UserMomentsPage';
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
import RTAPage from './pages/RTAPage';
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import BecomeModelPage from "@/pages/BecomeModelPage";
import FAQPage from "@/pages/FAQPage";
import AboutPage from "@/pages/AboutPage";
import CreatorsBlog from "@/pages/CreatorsBlog";
import VRGuide from "@/pages/VRGuide";
import BillingSupportPage from "@/pages/BillingSupportPage";
import OpenStudioPage from "@/pages/OpenStudioPage";
import AffiliatePage from "@/pages/AffiliatePage";
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
import WatchLaterPage from './pages/WatchLaterPage';
import EarningsPage from './pages/EarningsPage';
import CoreSettingsPage from './pages/CoreSettingsPage';
import ContentManagementPage from './pages/ContentManagementPage';
import ContestsPage from './pages/ContestsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FeaturedVideosPage from './pages/FeaturedVideosPage';
import PlaylistViewPage from '@/pages/PlaylistViewPage';
import PornstarsPage from './pages/PornstarsPage';
import GayPage from './pages/GayPage';
import LikedVideosPage from '@/pages/LikedVideosPage';

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
                  {/* All your existing routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/video/:id" element={<VideoPage />} />
                  <Route path="/playlist/:id" element={<PlaylistViewPage />} />
                  <Route path="/category/:category" element={<CategoryPage />} />
                  <Route path="/categories" element={<AllCategoriesPage />} />
                  <Route path="/moments" element={<MomentsPage />} />
                  <Route path="/moments/:username" element={<UserMomentsPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/profile/:username" element={<ProfilePage />} />
                  <Route path="/channel" element={<ChannelPage />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/blog" element={<CreatorsBlog />} />
                  <Route path="/vr-guide" element={<VRGuide />} />
                  <Route path="/billing-support" element={<BillingSupportPage />} />
                  <Route path="/open-studio" element={<OpenStudioPage />} />
                  <Route path="/affiliate" element={<AffiliatePage />} />
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
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/become-model" element={<BecomeModelPage />} />
                  <Route path="/playlists" element={<PlaylistsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/watch-later" element={<WatchLaterPage />} />
                  <Route path="/liked" element={<LikedVideosPage />} />
                  <Route path="/debug-auth" element={<DebugAuth />} />
                  <Route path="/core-settings" element={<CoreSettingsPage />} />
                  <Route path="/content-management" element={<ContentManagementPage />} />
                  <Route path="/contests" element={<ContestsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/featured-videos" element={<FeaturedVideosPage />} />
                  <Route path="/pornstars" element={<PornstarsPage />} />
                  <Route path="/gay" element={<GayPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/creator-dashboard"
                    element={
                      <ProtectedRoute allowedUserTypes={['individual_creator', 'studio_creator']}>
                        <CreatorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/studio-dashboard"
                    element={
                      <ProtectedRoute allowedUserTypes={['studio_creator']}>
                        <StudioDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute allowedUserTypes={['individual_creator', 'studio_creator']}>
                        <UploadPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Earnings route (protected) */}
                  <Route
                    path="/earnings"
                    element={
                      <ProtectedRoute allowedUserTypes={['individual_creator', 'studio_creator']}>
                        <EarningsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/rta" element={<RTAPage />} />
                  <Route path="/admin-hubx-2024" element={<AdminPanel />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AgeGateWrapper>
            </Router>

            {/* Root-level Analytics and SpeedInsights */}
            <Analytics />
            <SpeedInsights /> {/* <-- added here */}
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;