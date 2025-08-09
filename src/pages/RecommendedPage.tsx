import React, { useState } from 'react';
import { useOptimizedVideos } from '@/hooks/useOptimizedVideos';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import { Button } from '@/components/ui/button';
import { Grid, List, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CategoryFilter from '@/components/CategoryFilter';
import AdComponent from '@/components/AdComponent';

const RecommendedPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const { data, isLoading, error } = useOptimizedVideos(1, 60, selectedCategory || 'recommended');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Videos</h2>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Ad Code */}
        <AdComponent zoneId="5660536" />

        {/* Category Header */}
        <div className="space-y-4 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold capitalize mb-2 text-gray-900">
                Recommended Videos
              </h1>
              {data && (
                <p className="text-gray-600">
                  {data.totalCount.toLocaleString()} videos recommended for you
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">Category:</span>
              <CategoryFilter onCategoryChange={handleCategoryChange} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <div className="lg:w-1/4 hidden lg:block">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilter(!showFilter)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              <div className={`${showFilter ? 'block' : 'hidden'} lg:block`}>
                <CategoryFilter onCategoryChange={handleCategoryChange} />
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Videos` : 'Recommended Videos'}
                </h1>
                {selectedCategory && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedCategory}
                  </Badge>
                )}
                {data && (
                  <p className="text-gray-600 mt-2">
                    {data.totalCount.toLocaleString()} videos found
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="ml-2">Loading videos...</p>
              </div>
            ) : data?.videos && data.videos.length > 0 ? (
              <OptimizedVideoGrid 
                videos={data.videos} 
                viewMode={viewMode}
                showAds={true}
              />
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">No videos found</h2>
                <p className="text-gray-600">Try adjusting your search or browse different categories.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecommendedPage;