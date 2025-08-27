import React, { useState, useEffect } from 'react';
import { Grid3X3, List } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import Categories from '@/components/Categories';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOptimizedVideos } from '@/hooks/useOptimizedVideos';
import ImageStylePagination from '@/components/ImageStylePagination';

const categories = [
  'All',
  'recommended',
  'Trending',
  'Most Rated'
];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLoading, setShowLoading] = useState(true); // Added for optimized loading state

  // Get search query from URL params
  const searchQuery = searchParams.get('search') || undefined;

  // Initialize category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');

    if (categoryParam && categories.map(c => c.toLowerCase()).includes(categoryParam)) {
      const matchedCategory = categories.find(c => c.toLowerCase() === categoryParam) || 'All';
      setSelectedCategory(matchedCategory);
    }
  }, [searchParams]);

  // Use homepage sectioning for All/default, otherwise use category-specific logic
  const { data, isLoading, error } = useOptimizedVideos(
    currentPage,
    60,
    selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(),
    searchQuery
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  // Effect to manage the showLoading state
  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
    }
  }, [isLoading]);


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

      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            HubX Video Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing videos from creators around the world
          </p>
        </div>

        {/* Ad Code Below Hero Text */}
        <AdComponent zoneId="5660534" />

        {/* Mobile Categories Scroll - Mobile Only */}
        <div className="block md:hidden">
          <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
            {[
              'Amateur', 'Big Tits', 'MILF', 'Teen', 'Anal', 'Lesbian',
              'Ebony', 'Blowjob', 'Hardcore', 'POV', 'Big Ass', 'Latina',
              'Asian', 'Mature', 'Creampie', 'Cumshot'
            ].map((category) => (
              <Link
                key={category}
                to={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex-shrink-0"
              >
                <Badge
                  variant="outline"
                  className="whitespace-nowrap px-3 py-1 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {category}
                </Badge>
              </Link>
            ))}
            <Link
              to="/categories"
              className="flex-shrink-0"
            >
              <Badge
                variant="default"
                className="whitespace-nowrap px-3 py-1 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white"
              >
                View All
              </Badge>
            </Link>
          </div>
        </div>

        {/* Desktop Filters and View Toggle - Desktop Only */}
        <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        {/* Search Results Indicator */}
        {searchQuery && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                Search Results
              </Badge>
              <span className="text-blue-700 dark:text-blue-300">
                Showing results for "{searchQuery}"
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.location.href = '/';
              }}
              className="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              Clear Search
            </Button>
          </div>
        )}


        {/* Videos */}
        {showLoading ? (
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
          <OptimizedVideoGrid videos={videos} viewMode={viewMode} showAds={true} showMoments={selectedCategory === 'All'} />
        )}

        {/* Ad Code Before Pagination */}
        <AdComponent zoneId="5661270" className="my-8" />

        {/* Pagination */}
        {!isLoading && !error && (
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            theme="purple"
          />
        )}
      </main>

      {/* Categories Section */}
      <Categories />

      <Footer />
    </div>
  );
};

export default Index;