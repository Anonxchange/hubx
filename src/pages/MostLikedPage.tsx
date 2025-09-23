import React, { useState, useEffect } from 'react';
import { ThumbsUp, Heart, Award } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';
import ImageStylePagination from '@/components/ImageStylePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import type { LightVideo } from '@/services/optimizedVideosService';

const MostLikedPage = () => {
  const [videos, setVideos] = useState<LightVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const videosPerPage = 60;

  useEffect(() => {
    fetchMostLikedVideos();
  }, [currentPage]);

  const fetchMostLikedVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getOptimizedVideos(currentPage, videosPerPage, 'most rated');
      
      setVideos(result.videos);
      setTotalVideos(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching most liked videos:', error);
      setError('Failed to load most liked videos');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">

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
                <ThumbsUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error Loading Most Liked Videos</h3>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          </div>
        ) : videos.length > 0 ? (
          <>
            <OptimizedVideoGrid 
              videos={videos} 
              viewMode="grid" 
              showAds={true} 
              showMoments={false} 
              showPremiumSection={false} 
            />
            
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
            <ThumbsUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Most Liked Videos Found</h3>
            <p className="text-muted-foreground">
              Check back later as more videos get liked by the community.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MostLikedPage;