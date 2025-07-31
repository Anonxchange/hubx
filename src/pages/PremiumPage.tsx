import React, { useState, useEffect } from 'react';
import { Star, Crown, Zap, Shield, Clock, Eye } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoGrid from '@/components/VideoGrid';
import AdComponent from '@/components/AdComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVideos } from '@/hooks/useVideos';
import ImageStylePagination from '@/components/ImageStylePagination';

const PremiumPage = () => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, isLoading, error } = useVideos(
    currentPage,
    60,
    'premium'
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const premiumFeatures = [
    {
      icon: Crown,
      title: "Exclusive Content",
      description: "Access to premium, high-quality exclusive videos"
    },
    {
      icon: Zap,
      title: "HD Quality",
      description: "Crystal clear HD and 4K video streaming"
    },
    {
      icon: Shield,
      title: "Ad-Free Experience",
      description: "Enjoy uninterrupted viewing without ads"
    },
    {
      icon: Clock,
      title: "Early Access",
      description: "Get first access to new releases and content"
    },
    {
      icon: Eye,
      title: "Private Viewing",
      description: "Secure and private content viewing experience"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Main content area - fixed height with scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 rounded-2xl p-8 text-center text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="w-12 h-12 text-yellow-400 mr-3" />
                  <h1 className="text-4xl md:text-6xl font-bold">
                    Premium Content
                  </h1>
                </div>
                <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto mb-6">
                  Unlock exclusive, high-quality content with our premium collection
                </p>
                <Badge variant="secondary" className="bg-yellow-500 text-black text-lg px-6 py-2">
                  <Star className="w-5 h-5 mr-2" />
                  VIP Access
                </Badge>
              </div>
            </div>

            {/* Ad Code Below Hero */}
            <AdComponent zoneId="5660536" />

            {/* Premium Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              {premiumFeatures.map((feature, index) => (
                <Card key={index} className="border-purple-200 hover:border-purple-400 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <feature.icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-lg">{feature.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Premium Videos Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold flex items-center">
                    <Star className="w-8 h-8 text-yellow-500 mr-3" />
                    Premium Videos
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {totalCount} exclusive premium videos available
                  </p>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  Premium Only
                </Badge>
              </div>

              {/* Videos Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(12)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-video bg-muted"></div>
                      <CardContent className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">Error loading premium videos</h3>
                  <p className="text-muted-foreground">Please try again later.</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Premium Videos Available</h3>
                  <p className="text-muted-foreground">Premium content will be available soon.</p>
                </div>
              ) : (
                <VideoGrid videos={videos} viewMode="grid" showAds={true} />
              )}

              {/* Ad Code Before Pagination */}
              <AdComponent zoneId="5661270" className="my-8" />

              {/* Pagination */}
              {!isLoading && !error && totalPages > 1 && (
                <ImageStylePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Want More Premium Content?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join our premium community to access exclusive content, ad-free viewing, and early access to new releases.
                </p>
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PremiumPage;