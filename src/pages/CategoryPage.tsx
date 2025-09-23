
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';
import ImageStylePagination from '@/components/ImageStylePagination';
import CategoryFilter from '@/components/CategoryFilter';
import Footer from '@/components/Footer';
import { getCategoryVideos } from '@/services/videosService';
import type { Video } from '@/services/videosService';

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('Featured Recently');
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  const userId = localStorage.getItem('user_id') || undefined;

  const fetchCategoryVideos = async () => {
    if (!category) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const result = await getCategoryVideos(category, currentPage, 60, undefined, userId);
      setVideos(result.videos);
      setTotalPages(result.totalPages);
      setTotalVideos(result.totalCount);
    } catch (err) {
      console.error('Error fetching category videos:', err);
      setError('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategoryVideos();
  }, [category, currentPage, userId]);

  const categoryDisplayName = category?.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || 'Category';

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Ad Code */}
        <AdComponent zoneId="5660534" />

        {/* Category Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold capitalize mb-2">
                {categoryDisplayName} Videos
              </h1>
              <p className="text-muted-foreground">
                {totalVideos} videos in this category
              </p>
            </div>
          </div>
          
          {/* Category Filter */}
          <CategoryFilter 
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-lg">Loading videos...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-lg text-red-500">{error}</p>
          </div>
        )}

        {/* Videos Grid */}
        {!isLoading && !error && (
        
            <OptimizedVideoGrid videos={videos} viewMode="grid" showAds={true} showMoments={false} showPremiumSection={false} />
        )}

        {/* No Videos State */}
        {!isLoading && !error && videos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg">No videos found in this category.</p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default CategoryPage;
