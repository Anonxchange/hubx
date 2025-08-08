import AgeGateWrapper from './components/AgeGateWrapper';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AgeGateWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/admin-hubx-2024" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AgeGateWrapper>
  </QueryClientProvider>
);
