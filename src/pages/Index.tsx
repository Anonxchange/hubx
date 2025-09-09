import React, { useState, useEffect } from 'react';
import { Grid3X3, List } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import Categories from '@/components/Categories';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import CreatorProfileCard from '@/components/CreatorProfileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOptimizedVideos } from '@/hooks/useOptimizedVideos';
import { searchCreators, CreatorProfile } from '@/services/creatorSearchService';
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
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);

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

  // Search for creators when search query changes
  useEffect(() => {
    if (searchQuery) {
      setIsSearchingCreators(true);
      searchCreators(searchQuery)
        .then(foundCreators => {
          setCreators(foundCreators);
        })
        .catch(error => {
          console.error('Error searching creators:', error);
          setCreators([]);
        })
        .finally(() => {
          setIsSearchingCreators(false);
        });
    } else {
      setCreators([]);
    }
  }, [searchQuery]);


  const handleCategoryChange = React.useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

  

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

        {/* Desktop Categories Section */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
            {[
              'Amateur', 'Big Tits', 'MILF', 'Teen', 'Anal', 'Lesbian',
              'Ebony', 'Blowjob', 'Hardcore', 'POV', 'Big Ass', 'Latina',
              'Asian', 'Mature', 'Creampie', 'Cumshot', 'Blonde', 'Brunette',
              'Redhead', 'Threesome', 'Gangbang', 'Interracial', 'BBC', 'BWC'
            ].map((category) => (
              <Link
                key={category}
                to={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex-shrink-0"
              >
                <Badge
                  variant="outline"
                  className="whitespace-nowrap px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer border-2"
                >
                  {category}
                </Badge>
              </Link>
            ))}
            <Link to="/categories" className="flex-shrink-0">
              <Badge
                variant="default"
                className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              >
                View All Categories
              </Badge>
            </Link>
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
                {creators.length > 0 && (
                  <span> - Found {creators.length} creator{creators.length !== 1 ? 's' : ''}</span>
                )}
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

        {/* Creator Results Section - Show First */}
        {searchQuery && creators.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Creators</h2>
            <div className="space-y-3">
              {creators.map((creator) => (
                <CreatorProfileCard 
                  key={creator.id} 
                  creator={creator} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Video Results Section - Show After Creators */}
        {searchQuery && videos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Videos</h2>
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
          <OptimizedVideoGrid 
            videos={videos} 
            viewMode={viewMode} 
            showAds={true} 
            showMoments={selectedCategory === 'All'} 
            showPremiumSection={selectedCategory === 'All' && !searchQuery}
          />
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