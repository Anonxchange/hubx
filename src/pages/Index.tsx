
import React, { useState } from 'react';
import { Search, Grid3X3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';
import AdBanner from '@/components/AdBanner';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideos } from '@/hooks/useVideos';

const categories = [
  'All',
  'Big Ass',
  'Big Tits',
  'Japanese',
  'Hentai',
  'Ebony',
  'MILF',
  'Amateur',
  'Anal',
  'Blonde',
  'Brunette',
  'Teen',
  'BBW',
  'Lesbian',
  'Cumshot',
  'Blowjob',
  'Creampie',
  'Facial',
  'Interracial',
  'POV'
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tempSearch, setTempSearch] = useState('');
  
  const { data, isLoading, error } = useVideos(
    currentPage,
    30,
    selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(),
    searchQuery
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(tempSearch);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const pages = getVisiblePages();

    return (
      <div className="flex items-center justify-center space-x-1 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1 text-muted-foreground">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className={`min-w-[40px] ${
                  currentPage === page 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-4 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            HubX Video Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing videos from creators around the world
          </p>
        </div>

        {/* Ad Banner - Above Search Bar */}
        <AdBanner admpid="344759" className="my-2" />

        {/* Filters and Search Bar - Closer together */}
        <div className="space-y-3">
          {/* Categories and View Toggle */}
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
                        {category}
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

          {/* Search Bar - Now closer to categories */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search videos..."
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Search results for "<span className="font-medium">{searchQuery}</span>" 
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {totalCount} results found
            </p>
          </div>
        )}

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
          <VideoGrid videos={videos} viewMode={viewMode} />
        )}

        {/* Custom Pagination */}
        {renderPagination()}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
