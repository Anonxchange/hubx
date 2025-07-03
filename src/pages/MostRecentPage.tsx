import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Grid3X3, List } from 'lucide-react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';
import Footer from '@/components/Footer';
import ImageStylePagination from '@/components/ImageStylePagination';
import AdComponent from '@/components/AdComponent';
import { Button } from '@/components/ui/button';
import { useVideos } from '@/hooks/useVideos';

const MostRecentPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data, isLoading, error } = useVideos(currentPage, 30);
  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Most Recent Videos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The latest uploads from our creators
          </p>
        </div>

        {/* Ad Code */}
        <AdComponent zoneId="5660536" />

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Showing {totalCount} recent videos</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">View:</span>
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Videos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card rounded-lg">
                <div className="aspect-video bg-muted"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Error loading videos</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        ) : (
          <VideoGrid videos={videos} viewMode={viewMode} showAds={true} />
        )}

        {/* Ad Code Before Pagination */}
        <AdComponent zoneId="5661270" className="my-8" />

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex justify-center">
              <ImageStylePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MostRecentPage;