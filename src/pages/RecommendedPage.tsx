import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedVideoGrid from "@/components/OptimizedVideoGrid";
import AdComponent from "@/components/AdComponent";
import ImageStylePagination from "@/components/ImageStylePagination";
import { useOptimizedVideos } from "@/hooks/useOptimizedVideos";

const RecommendedPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 60;

  // Using fixed "recommended" category or tag
  const { data, isLoading, error } = useOptimizedVideos(
    currentPage,
    videosPerPage,
    "recommended"
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll up on page change
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Ad Banner */}
        <AdComponent zoneId="5660536" />

        {/* Page Title */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Recommended Videos</h1>
          {data && (
            <p className="text-muted-foreground">
              {data.totalCount.toLocaleString()} videos recommended for you
            </p>
          )}
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading videos...</span>
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-red-600">
            <p>Error loading videos. Please try again.</p>
          </div>
        )}

        {/* Videos Grid */}
        {data && data.videos.length > 0 ? (
          <OptimizedVideoGrid videos={data.videos} />
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <p>No recommended videos found.</p>
            </div>
          )
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RecommendedPage;