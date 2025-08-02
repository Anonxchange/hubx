
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';
import AdComponent from '@/components/AdComponent';
import ImageStylePagination from '@/components/ImageStylePagination';
import CategoryFilter from '@/components/CategoryFilter';
import { useVideosByCategory } from '@/hooks/useVideos';

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('Featured Recently');
  
  const { data, isLoading, error } = useVideosByCategory(category || '', currentPage, 60);
  
  const videos = data?.videos || [];
  const totalPages = data?.totalPages || 1;
  const totalVideos = data?.totalCount || 0;

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
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Ad Code */}
        <AdComponent zoneId="5660536" />

        {/* Category Header */}
        <div className="space-y-4">
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

        {/* Videos Grid */}
        <VideoGrid 
          videos={videos}
        />

        {/* Pagination */}
        <ImageStylePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
};

export default CategoryPage;
