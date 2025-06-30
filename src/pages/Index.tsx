
import React, { useState } from 'react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';
import AdBanner from '@/components/AdBanner';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import SearchSection from '@/components/SearchSection';
import FilterSection from '@/components/FilterSection';
import PaginationComponent from '@/components/PaginationComponent';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-4 flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Ad Banner - Above Search Bar */}
        <AdBanner admpid="344759" className="my-2" />

        {/* Filters and Search Bar - Closer together */}
        <div className="space-y-3">
          {/* Categories and View Toggle */}
          <FilterSection 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Search Bar - Now closer to categories */}
          <SearchSection 
            tempSearch={tempSearch}
            setTempSearch={setTempSearch}
            onSearch={handleSearch}
          />
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

        {/* Pagination */}
        <PaginationComponent 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
