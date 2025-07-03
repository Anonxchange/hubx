
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VideoPage from "./pages/VideoPage";
import CategoryPage from "./pages/CategoryPage";
import TrendingPage from "./pages/TrendingPage";
import MostRecentPage from "./pages/MostRecentPage";
import TopRatedPage from "./pages/TopRatedPage";
import MostViewedPage from "./pages/MostViewedPage";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/video/:id" element={<VideoPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/most-recent" element={<MostRecentPage />} />
          <Route path="/top-rated" element={<TopRatedPage />} />
          <Route path="/most-viewed" element={<MostViewedPage />} />
          <Route path="/admin-hubx-2024" element={<AdminPanel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
