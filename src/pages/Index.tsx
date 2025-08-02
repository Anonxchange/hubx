import React, { useState, useEffect } from 'react';
import { Grid3X3, List } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Categories from '@/components/Categories';
import VideoGrid from '@/components/VideoGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideos } from '@/hooks/useVideos';
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

  // Initialize category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    
    if (categoryParam && categories.map(c => c.toLowerCase()).includes(categoryParam)) {
      const matchedCategory = categories.find(c => c.toLowerCase() === categoryParam) || 'All';
      setSelectedCategory(matchedCategory);
    }
  }, [searchParams]);
  
  const { data, isLoading, error } = useVideos(
    currentPage,
    20,
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
            HubX Video Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing videos from creators around the world
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
          <VideoGrid videos={videos} viewMode={viewMode} showAds={true} />
        )}

        {/* Ad Code Before Pagination */}
        <AdComponent zoneId="5661270" className="my-8" />

        {/* Pagination */}
        {!isLoading && !error && (
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
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