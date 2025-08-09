
import React, { useState } from 'react';
import { Star, Crown } from 'lucide-react';
import PremiumHeader from '@/components/PremiumHeader';
import PremiumFooter from '@/components/PremiumFooter';
import PremiumVideoCard from '@/components/PremiumVideoCard';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white flex flex-col">
      <PremiumHeader />
      
      <main className="flex-1 container mx-auto px-4 py-4 space-y-4">
        {/* Compact Hero */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center mb-2">
            <Crown className="w-8 h-8 text-yellow-400 mr-2" />
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-400 bg-clip-text text-transparent">
              PREMIUM COLLECTION
            </h1>
            <Star className="w-8 h-8 text-orange-400 ml-2" />
          </div>
          <p className="text-sm text-purple-100">
            {totalCount} exclusive premium videos
          </p>
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gradient-to-br from-black/80 to-purple-900/20 border border-purple-500/20 rounded-lg">
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-orange-500/20 rounded-t-lg"></div>
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-purple-500/20 rounded w-3/4"></div>
                  <div className="h-2 bg-purple-500/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Crown className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-white">Error loading premium content</h3>
            <p className="text-gray-400 text-sm">Please try again later.</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-white">Premium Content Coming Soon</h3>
            <p className="text-gray-400 text-sm">Exclusive premium videos will be available shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <PremiumVideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex justify-center py-4">
            <ImageStylePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      <PremiumFooter />
    </div>
  );
};

export default Recommended;
