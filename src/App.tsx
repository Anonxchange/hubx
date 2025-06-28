
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VideoPage from "./pages/VideoPage";
import CategoryPage from "./pages/CategoryPage";
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
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/live-cams" element={<Index />} />
          <Route path="/bet-now" element={<Index />} />
          <Route path="/1win" element={<Index />} />
          <Route path="/porn-girls" element={<Index />} />
          <Route path="/featured" element={<Index />} />
          <Route path="/recommended" element={<Index />} />
          <Route path="/shorties" element={<Index />} />
          <Route path="/hottest-nigeria" element={<Index />} />
          <Route path="/channels" element={<Index />} />
          <Route path="/playlists" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
