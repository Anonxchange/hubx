
import React, { useState } from 'react';
import { Star, Crown, Zap, Shield, Clock, Eye } from 'lucide-react';
import PremiumHeader from '@/components/PremiumHeader';
import PremiumFooter from '@/components/PremiumFooter';
import PremiumVideoCard from '@/components/PremiumVideoCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVideos } from '@/hooks/useVideos';
import ImageStylePagination from '@/components/ImageStylePagination';

const PremiumPage = () => {
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
      description: "Access to premium, high-quality exclusive videos",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Zap,
      title: "4K Ultra HD",
      description: "Crystal clear 4K and 8K video streaming",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Ad-Free Experience",
      description: "Enjoy completely uninterrupted premium viewing",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Clock,
      title: "Early Access",
      description: "Get first access to new premium releases",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Eye,
      title: "Private VIP Viewing",
      description: "Secure and private premium content experience",
      color: "from-red-500 to-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white flex flex-col">
      <PremiumHeader />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-purple-900/80 via-black to-orange-900/80 rounded-3xl p-12 text-center overflow-hidden border border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/10 to-orange-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <Crown className="w-16 h-16 text-yellow-400 mr-4 animate-pulse" />
                <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-400 bg-clip-text text-transparent">
                  PREMIUM
                </h1>
                <Star className="w-16 h-16 text-orange-400 ml-4 animate-pulse" />
              </div>
              <p className="text-2xl md:text-3xl text-purple-100 max-w-4xl mx-auto mb-8 font-light">
                Unlock the ultimate collection of exclusive, high-quality premium content
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-lg px-8 py-3 font-bold">
                  <Crown className="w-6 h-6 mr-2" />
                  VIP ACCESS ONLY
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-8 py-3 font-bold">
                  <Shield className="w-6 h-6 mr-2" />
                  AD-FREE
                </Badge>
              </div>
            </div>
          </div>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="border-purple-500/30 bg-gradient-to-br from-black/80 to-purple-900/20 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col items-center space-y-3 text-center">
                    <div className={`p-4 bg-gradient-to-r ${feature.color} rounded-xl shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Premium Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-3xl font-bold text-yellow-400 mb-2">{totalCount}</h3>
                <p className="text-gray-300">Premium Videos</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-3xl font-bold text-purple-400 mb-2">4K</h3>
                <p className="text-gray-300">Ultra HD Quality</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-3xl font-bold text-green-400 mb-2">0</h3>
                <p className="text-gray-300">Ads Shown</p>
              </CardContent>
            </Card>
          </div>

          {/* Premium Videos Section */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold flex items-center justify-center mb-4">
                <Star className="w-10 h-10 text-yellow-500 mr-4" />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Premium Collection
                </span>
                <Crown className="w-10 h-10 text-purple-500 ml-4" />
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Discover {totalCount} exclusive premium videos crafted for the ultimate viewing experience
              </p>
            </div>

            {/* Videos Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-gradient-to-br from-black/80 to-purple-900/20 border-purple-500/20">
                    <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-orange-500/20"></div>
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
                      <div className="h-3 bg-purple-500/20 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <Crown className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-white">Error loading premium content</h3>
                <p className="text-gray-400">Please try again later.</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16">
                <Crown className="w-20 h-20 text-purple-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-white">Premium Content Coming Soon</h3>
                <p className="text-gray-400 mb-8">Exclusive premium videos will be available shortly.</p>
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold">
                  <Crown className="w-5 h-5 mr-2" />
                  Get Notified
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {videos.map((video) => (
                  <PremiumVideoCard key={video.id} video={video} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
              <div className="flex justify-center">
                <ImageStylePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-purple-900/50 via-black/80 to-orange-900/50 border-gradient border-purple-500/30">
            <CardContent className="p-12 text-center">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Ready for the Premium Experience?
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Join our exclusive premium community for unlimited access to the finest content, 
                ad-free viewing, and VIP treatment you deserve.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg">
                  <Crown className="w-6 h-6 mr-3" />
                  Upgrade to Premium
                </Button>
                <Button size="lg" variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20 px-8 py-4 text-lg">
                  <Star className="w-6 h-6 mr-3" />
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PremiumFooter />
    </div>
  );
};

export default PremiumPage;
