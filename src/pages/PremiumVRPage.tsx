
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const PremiumVRPage = () => {
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
    'premium', // category
    'virtual reality', // tag - filter for VR content
    undefined, // sortBy
    true // premiumOnly - ensure only premium content
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  // Filter videos based on search term and ensure they have VR tags
  const filteredVideos = videos.filter(video => {
    const hasVRTag = video.tags && video.tags.some(tag => 
      tag.toLowerCase().includes('virtual reality') || 
      tag.toLowerCase().includes('vr') ||
      tag.toLowerCase().includes('virtual')
    );
    
    const matchesSearch = searchTerm === '' || 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.channelName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return hasVRTag && matchesSearch;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-black border-b border-gray-800">
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          <span>Live</span>
          <Heart className="w-3 h-3 text-pink-500 ml-2" />
          <span>Sex Chat</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-400">VR Only</span>
          <div className="w-8 h-4 bg-green-500 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5"></div>
          </div>
          <div className="relative">
            <Heart className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-3 h-3 flex items-center justify-center text-white text-[8px]">2</span>
          </div>
          <Settings className="w-4 h-4" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-black px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/premium" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-lg font-bold text-yellow-400">Premium VR</h1>
              <p className="text-xs text-gray-400">Virtual Reality Experience</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsRecommendedModalOpen(true)}
              className="relative hover:bg-gray-800 p-1 rounded transition-colors"
            >
              <DollarSign className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
                20
              </Badge>
            </button>
            {user ? (
              <ProfileDropdown />
            ) : (
              <button onClick={() => setIsSignInModalOpen(true)}>
                <User className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            )}
            <Button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1 h-7"
            >
              Join now
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto bg-black border-b border-gray-800 px-4">
        {['Videos', 'VR Porn', 'Categories', 'Pornstars', 'Channels', 'Community'].map((tab, index) => (
          <button
            key={tab}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
              index === 1
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* VR Section Header */}
      <div className="bg-gradient-to-r from-purple-900/30 via-black to-blue-900/30 px-4 py-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🥽</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Premium VR Porn</h2>
            <p className="text-gray-300 text-sm">Immersive Virtual Reality Experience</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-purple-600 text-white">360° Experience</Badge>
          <Badge className="bg-blue-600 text-white">4K Ultra HD</Badge>
          <Badge className="bg-green-600 text-white">Oculus Compatible</Badge>
          <Badge className="bg-pink-600 text-white">Interactive</Badge>
        </div>
      </div>

      {/* Content Title */}
      <div className="px-4 py-3 bg-black">
        <h3 className="text-lg font-bold text-white">Premium VR Videos ({filteredVideos.length})</h3>
        <p className="text-gray-400 text-sm">Experience adult content like never before in virtual reality</p>
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
            <h3 className="text-lg font-semibold mb-2 text-white">Error loading VR content</h3>
            <p className="text-gray-400 text-sm">Please try again later.</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🥽</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">
              {searchTerm ? 'No VR videos found' : 'VR Content Coming Soon'}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchTerm 
                ? `No VR videos match "${searchTerm}". Try different keywords.`
                : 'Premium virtual reality content will be available shortly.'
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
                      />

                      {/* VR Badge Overlay */}
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-3 py-1">
                          <span className="mr-1">🥽</span>
                          VR
                        </Badge>
                      </div>

                      {/* Premium + VR Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-2 py-1 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          PREMIUM VR
                        </Badge>
                      </div>

                      {/* Duration */}
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration || '15:30'}
                        </span>
                      </div>

                      {/* VR Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-blue-900/20"></div>
                    </div>

                    {/* Video Info Card */}
                    <div className="p-4 bg-gradient-to-r from-black via-purple-900/10 to-black">
                      <div className="flex items-start space-x-3">
                        {/* Creator Avatar */}
                        <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                          {(video.profiles?.avatar_url || video.uploader_avatar) ? (
                            <img
                              src={video.profiles?.avatar_url || video.uploader_avatar}
                              alt={video.uploader_username || "Creator"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('Avatar failed to load:', video.profiles?.avatar_url || video.uploader_avatar);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const username = video.uploader_username || video.profiles?.username || video.uploader_name || "User";
                                  parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">${username.charAt(0).toUpperCase()}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                              {(video.uploader_username || video.profiles?.username || video.uploader_name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Video Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2">
                            {video.title}
                          </h3>
                          <p className="text-gray-300 text-xs mb-1">
                            {video.uploader_username || video.uploader_name || "Premium VR Creator"}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {video.views || '0'}
                            </span>
                            <span>•</span>
                            <span>🥽 VR Ready</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center py-6 px-4">
                <ImageStylePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  theme="purple"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 safe-area-bottom">
        <div className="flex justify-around py-2">
          <Link to="/premium" className="flex flex-col items-center py-2 px-4">
            <Play className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Videos</span>
          </Link>
          <button className="flex flex-col items-center py-2 px-4">
            <Search className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-400 mt-1">VR Search</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4">
            <Heart className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Favorites</span>
          </button>
          {user ? (
            <div className="flex flex-col items-center py-2 px-4">
              <ProfileDropdown />
              <span className="text-xs text-gray-400 mt-1">Profile</span>
            </div>
          ) : (
            <button onClick={() => setIsSignInModalOpen(true)} className="flex flex-col items-center py-2 px-4">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Profile</span>
            </button>
          )}
        </div>
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

export default PremiumVRPage;
