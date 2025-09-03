import React, { useState, useEffect } from 'react';
import { Star, Crown, Sparkles, Eye, PlayCircle, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';
import ImageStylePagination from '@/components/ImageStylePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVideos } from '@/services/videosService';
import type { Video } from '@/services/videosService';

const FeaturedPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const videosPerPage = 60;
  const userId = localStorage.getItem('user_id') || undefined;

  useEffect(() => {
    fetchFeaturedVideos();
  }, [currentPage, selectedCategory]);

  const fetchFeaturedVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (selectedCategory) {
        // Get videos filtered by category (excludes premium/moment)
        result = await getVideos(currentPage, videosPerPage, selectedCategory);
      } else {
        // Get all featured videos (excludes premium/moment) 
        result = await getVideos(currentPage, videosPerPage);
      }
      
      setVideos(result.videos);
      setTotalVideos(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      setError('Failed to load featured videos');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filtering
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearCategory = () => {
    setSelectedCategory('');
    setCurrentPage(1); // Reset to first page when clearing filter
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <Star className="h-6 w-6 text-purple-500" />
            <Sparkles className="h-6 w-6 text-pink-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {selectedCategory ? `Featured ${selectedCategory} Videos` : 'Featured Videos'}
          </h1>
          {selectedCategory && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              >
                {selectedCategory}
              </Badge>
              <button
                onClick={handleClearCategory}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Top Ad Banner */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-4xl">
            <AdComponent zoneId="5660534" />
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
        ) : error ? (
          <div className="text-center py-12">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6">
                <Crown className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error Loading Featured Videos</h3>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          </div>
        ) : videos.length > 0 ? (
          <>
            {/* Featured Categories */}
            <div className="px-4">
              <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
                <Badge 
                  variant={!selectedCategory ? "secondary" : "outline"}
                  className={`flex-shrink-0 hover:bg-yellow-200 cursor-pointer whitespace-nowrap px-3 py-1 transition-colors ${
                    !selectedCategory 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={handleClearCategory}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  All Featured
                </Badge>
                {[
                  'Amateur', 'Big Tits', 'MILF', 'Teen', 'Anal', 'Lesbian',
                  'Ebony', 'Blowjob', 'Hardcore', 'POV', 'Big Ass', 'Latina',
                  'Asian', 'Mature', 'Creampie', 'Cumshot'
                ].map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "secondary" : "outline"}
                    className={`flex-shrink-0 whitespace-nowrap px-3 py-1 cursor-pointer transition-colors ${
                      selectedCategory === category
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            <OptimizedVideoGrid videos={videos} viewMode="grid" showAds={true} showMoments={false} showPremiumSection={false} />
            
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
            <Crown className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Featured Videos Available</h3>
            <p className="text-muted-foreground">
              Check back later for our curated selection of featured content.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FeaturedPage;