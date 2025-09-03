
import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Eye, Heart, Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';
import ImageStylePagination from '@/components/ImageStylePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTrendingVideos, getUserCountry } from '@/services/videosService';
import type { Video } from '@/services/videosService';

const TrendingPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [userCountry, setUserCountry] = useState<string>('Global');
  const [selectedLocation, setSelectedLocation] = useState<string>('Global');
  const [totalPages, setTotalPages] = useState(1);
  
  const videosPerPage = 60;

  // Common countries/regions for filtering
  const locationOptions = [
    'Global',
    'United States',
    'United Kingdom', 
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'Brazil',
    'India',
    'Nigeria',
    'South Africa'
  ];

  useEffect(() => {
    // Get user's country on component mount
    const fetchUserCountry = async () => {
      try {
        const country = await getUserCountry();
        setUserCountry(country);
      } catch (error) {
        console.error('Error getting user country:', error);
      }
    };
    
    fetchUserCountry();
  }, []);

  useEffect(() => {
    fetchTrendingVideos();
  }, [currentPage, selectedLocation]);

  const fetchTrendingVideos = async () => {
    try {
      setLoading(true);
      
      const result = await getTrendingVideos(
        currentPage, 
        videosPerPage, 
        selectedLocation === 'Global' ? undefined : selectedLocation
      );
      
      setVideos(result.videos);
      setTotalVideos(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching trending videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    setCurrentPage(1); // Reset to first page when changing location
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <Flame className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Trending Now
          </h1>
        </div>

        {/* Top Ad Banner */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-4xl">
            <AdComponent zoneId="5660534" />
          </div>
        </div>

        {/* Trending Categories */}
        <div className="px-4">
          <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
            <Badge variant="secondary" className="flex-shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 hover:bg-orange-200 cursor-pointer whitespace-nowrap px-3 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              All Trending
            </Badge>
            {[
              'Amateur', 'Big Tits', 'MILF', 'Teen', 'Anal', 'Lesbian',
              'Ebony', 'Blowjob', 'Hardcore', 'POV', 'Big Ass', 'Latina',
              'Asian', 'Mature', 'Creampie', 'Cumshot'
            ].map((category) => (
              <Link
                key={category}
                to={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex-shrink-0"
              >
                <Badge
                  variant="outline"
                  className="whitespace-nowrap px-3 py-1 hover:bg-muted cursor-pointer transition-colors"
                >
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        {loading ? (
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
        ) : videos.length > 0 ? (
          <>
            
            
            <OptimizedVideoGrid videos={videos} viewMode="grid" showAds={true} />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <ImageStylePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Flame className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No trending videos found</h3>
            <p className="text-muted-foreground">
              {selectedLocation === 'Global' 
                ? 'Check back later for trending content.'
                : `No trending videos found for ${selectedLocation}. Try Global or another location.`
              }
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrendingPage;
