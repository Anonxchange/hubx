import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AgeGateWrapper from "./components/AgeGateWrapper";
import Index from "./pages/Index";
import VideoPage from "./pages/VideoPage";
import CategoryPage from "./pages/CategoryPage";
import AllCategoriesPage from "./pages/AllCategoriesPage";
import MomentsPage from "./pages/MomentsPage";
import RecommendedPage from "./pages/RecommendedPage";
import HottestPage from './pages/HottestPage';
import TrendingPage from './pages/TrendingPage';
import PremiumPage from "./pages/PremiumPage";
import AdminPanel from "./pages/AdminPanel";
import ContactUs from "./pages/ContactUs";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import BecomeModelPage from "@/pages/BecomeModelPage";
import FAQPage from "@/pages/FAQPage";
import CreatorDashboard from '@/pages/CreatorDashboard';
import StudioDashboard from './pages/StudioDashboard';

import ProtectedRoute from './components/ProtectedRoute'; // Your ProtectedRoute component

import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from '@/contexts/LanguageContext';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AgeGateWrapper>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/video/:id" element={<VideoPage />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/categories" element={<AllCategoriesPage />} />
                <Route path="/moments" element={<MomentsPage />} />
                <Route path="/recommended" element={<RecommendedPage />} />
                <Route path="/hottest" element={<HottestPage />} />
                <Route path="/hottest/:country" element={<HottestPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/become-model" element={<BecomeModelPage />} />
                <Route path="/faq" element={<FAQPage />} />

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

                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

                {/* Protected Admin Panel */}
                <Route
                  path="/admin-hubx-2024"
                  element={
                    <ProtectedRoute allowedUserTypes={['admin']}>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />

                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AgeGateWrapper>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;