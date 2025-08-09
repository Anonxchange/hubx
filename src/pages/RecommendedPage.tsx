
<old_str>
import React, { useState } from 'react';
import { useOptimizedVideos } from '@/hooks/useOptimizedVideos';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import { Button } from '@/components/ui/button';
import { Grid, List, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CategoryFilter from '@/components/CategoryFilter';

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
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
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
</old_str>
<new_str>
import React, { useState } from 'react';
import { Grid3X3, List } from 'lucide-react';
import { useOptimizedVideos } from '@/hooks/useOptimizedVideos';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageStylePagination from '@/components/ImageStylePagination';

const categories = [
  'All',
  'recommended',
  'Trending',
  'Most Rated'
];

const RecommendedPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data, isLoading, error } = useOptimizedVideos(
    currentPage,
    60,
    selectedCategory === 'All' ? undefined : selectedCategory
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Recommended for You
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover personalized video recommendations based on your preferences
          </p>
        </div>

        {/* Ad Code Below Hero Text */}
        <AdComponent zoneId="5660536" />

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Category:</span>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'recommended' ? 'Recommended' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Sort:</span>
              <Badge variant="secondary">Newest</Badge>
            </div>
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
            <h2 className="text-xl font-semibold mb-2">Error loading videos</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        ) : (
          <OptimizedVideoGrid videos={videos} viewMode={viewMode} showAds={true} />
        )}

        {/* Ad Code Before Pagination */}
        <AdComponent zoneId="5661270" className="my-8" />

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RecommendedPage;
</new_str>
