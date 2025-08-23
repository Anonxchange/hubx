
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Crown, Play, Eye, Clock, DollarSign, Search, User, Heart, Settings, ThumbsUp } from 'lucide-react';
import PremiumVideoCard from '@/components/PremiumVideoCard';
import SubscriptionModal from '@/components/SubscriptionModal';
import SignInModal from '@/components/SignInModal';
import RecommendedVideosModal from '@/components/RecommendedVideosModal';
import SearchModal from '@/components/SearchModal';
import PremiumPageFooter from '@/components/PremiumPageFooter';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/contexts/AuthContext';
import ImageStylePagination from '@/components/ImageStylePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PremiumCategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isRecommendedModalOpen, setIsRecommendedModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const { user } = useAuth();

  const { data, isLoading, error } = useVideos(
    currentPage,
    60,
    category, // Use the category from URL params
    undefined, // tag
    undefined, // sortBy
    true // premiumOnly - ensure only premium content
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  // Filter videos based on search term
  const filteredVideos = videos.filter(video => 
    searchTerm === '' || 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.channelName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const categoryDisplayName = category?.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || 'Category';

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Header */}
      <div className="bg-black px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/premium" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-lg font-bold text-yellow-400">Premium {categoryDisplayName}</h1>
              <p className="text-xs text-gray-400">{totalCount} exclusive videos</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRecommendedModalOpen(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
              
              {user ? (
                <ProfileDropdown />
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignInModalOpen(true)}
                    className="text-white hover:text-yellow-400"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-black min-h-screen">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-900 aspect-video"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <Crown className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-white">Error loading premium content</h3>
            <p className="text-gray-400 text-sm">Please try again later.</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              {searchTerm ? 'No videos found' : `No Premium ${categoryDisplayName} Videos Yet`}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchTerm 
                ? `No videos match "${searchTerm}". Try different keywords.`
                : `Exclusive premium ${categoryDisplayName.toLowerCase()} videos will be available shortly.`
              }
            </p>
          </div>
        ) : (
          <>
            {/* Video Cards - Full Width No Container */}
            <div className="space-y-0">
              {filteredVideos.map((video, index) => (
                <Link key={video.id} to={`/premium/video/${video.id}`} className="block">
                  <div className="bg-black relative">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Premium Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-yellow-500/90 text-black text-xs font-semibold px-2 py-1">
                          <Crown className="w-3 h-3 mr-1" />
                          PREMIUM
                        </Badge>
                      </div>

                      {/* Duration */}
                      <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-xs">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {Math.floor(Math.random() * 20) + 5}:00
                      </div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-yellow-500/20 rounded-full p-4">
                          <Play className="w-8 h-8 text-yellow-400 fill-current" />
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2 flex-1">
                          {video.title}
                        </h3>
                        <div className="flex items-center space-x-3 ml-4 text-gray-400 text-sm">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {(video.view_count || Math.floor(Math.random() * 10000)).toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {Math.floor(Math.random() * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{video.channelName || 'Premium Channel'}</span>
                        <span>{Math.floor(Math.random() * 7) + 1} days ago</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4">
                <ImageStylePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      {/* Recommended Videos Modal */}
      <RecommendedVideosModal
        isOpen={isRecommendedModalOpen}
        onClose={() => setIsRecommendedModalOpen(false)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        videos={filteredVideos}
        onSearchChange={(term) => setSearchTerm(term)}
      />

      {/* Premium Page Footer */}
      <PremiumPageFooter />
    </div>
  );
};

export default PremiumCategoryPage;
