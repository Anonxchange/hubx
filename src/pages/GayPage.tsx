import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoGrid from '@/components/VideoGrid';
import CategoryFilter from '@/components/CategoryFilter';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import { Video } from '@/services/videosService';
import { Skeleton } from '@/components/ui/skeleton';
import AdComponent from '@/components/AdComponent';

const GayPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('Featured Recently');
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGayVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the optimized videos service to fetch videos tagged with "gay"
      const result = await getOptimizedVideos(currentPage, 60, 'gay');
      
      // Transform the optimized video data to match the Video interface
      const transformedVideos = result.videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        video_url: '', // Required by Video interface
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        views: video.views,
        likes: video.likes,
        dislikes: 0, // Required by Video interface
        tags: video.tags,
        created_at: video.created_at,
        updated_at: video.created_at, // Required by Video interface
        is_premium: video.is_premium,
        owner_id: video.owner_id,
        uploader_username: video.uploader_username,
        uploader_type: video.uploader_type,
        uploader_id: video.uploader_id,
        uploader_avatar: video.uploader_avatar,
        uploader_subscribers: video.uploader_subscribers,
        uploader_verified: video.uploader_verified,
      }));
      
      setVideos(transformedVideos);
      setTotalPages(result.totalPages);
      setTotalVideos(result.totalCount);
    } catch (err) {
      console.error('Error fetching gay videos:', err);
      setError('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGayVideos();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    // You can add specific filtering logic here if needed
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Ad Banner */}
          <div className="w-full flex justify-center mb-8">
            <div className="w-full max-w-4xl">
              <AdComponent zoneId="5660534" />
            </div>
          </div>

          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Gay Videos
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover the latest gay content from our creators
            </p>
            {totalVideos > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {totalVideos.toLocaleString()} videos available
              </p>
            )}
          </div>

          {/* Filter Section */}
          <div className="mb-8">
            <CategoryFilter 
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={fetchGayVideos}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                data-testid="button-retry"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Videos Grid */}
          {!isLoading && !error && videos.length > 0 && (
            <VideoGrid 
              videos={videos}
              showAds={true}
            />
          )}

          {/* No Results */}
          {!isLoading && !error && videos.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">
                No gay videos found
              </h3>
              <p className="text-muted-foreground">
                Check back later for new content.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GayPage;