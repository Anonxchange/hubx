import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Crown, Play, Eye, Clock, DollarSign, Search, User, Heart, Settings, ThumbsUp, Users } from 'lucide-react';
import PremiumVideoCard from '@/components/PremiumVideoCard';
import SubscriptionModal from '@/components/SubscriptionModal';
import SignInModal from '@/components/SignInModal';
import RecommendedVideosModal from '@/components/RecommendedVideosModal';
import SearchModal from '@/components/SearchModal';
import CategoriesModal from '@/components/CategoriesModal';
import PremiumPageFooter from '@/components/PremiumPageFooter';
import ProfileDropdown from '@/components/ProfileDropdown';
import CreatorPostCard from '@/components/CreatorPostCard';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedPosts, createPost } from '@/services/socialFeedService';
import ImageStylePagination from '@/components/ImageStylePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PremiumPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'originals' | 'top-creator' | 'best-vids'>('all');
  const [activeTab, setActiveTab] = useState<'videos' | 'community'>('videos');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isRecommendedModalOpen, setIsRecommendedModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const { user } = useAuth();

  const { data, isLoading, error } = useVideos(
    currentPage,
    60,
    'premium', // category - use premium category to ensure proper filtering
    undefined, // tag
    undefined, // sortBy
    false // premiumOnly - let the category handle the filtering
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  // Filter videos based on search term only when search modal is not open
  const filteredVideos = isSearchModalOpen ? videos : videos.filter(video => 
    searchTerm === '' || 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.channelName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const loadFeedPosts = async () => {
    if (!user) {
      setFeedLoading(false);
      return;
    }

    setFeedLoading(true);
    try {
      // Get only premium creator subscriptions for premium feed
      const posts = await getFeedPosts(30);

      // Filter posts to only show those from premium creators
      const premiumPosts = posts.filter(post => 
        post.creator?.user_type === 'individual_creator' || 
        post.creator?.user_type === 'studio_creator'
      );

      setFeedPosts(premiumPosts);
    } catch (error) {
      console.error('Error loading premium feed posts:', error);
      setFeedPosts([]);
    } finally {
      setFeedLoading(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;

    if (user && activeTab === 'community') {
      // Only load if we haven't loaded yet or user changed
      if (feedPosts.length === 0 && !feedLoading) {
        loadFeedPosts().then(() => {
          if (!mounted) return;
          // Feed loaded successfully
        });
      }
    } else if (!user && activeTab === 'community') {
      setFeedPosts([]);
      setFeedLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user?.id, activeTab]);

  const filters = [
    { id: 'all', icon: Play, label: 'All' },
    { id: 'originals', icon: Crown, label: 'Originals' },
    { id: 'top-creator', icon: Star, label: 'Top creator vids' },
    { id: 'best-vids', icon: Heart, label: 'Best vids' }
  ];

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
          <span className="text-gray-400">VR Only</span>
          <div className="w-8 h-4 bg-gray-600 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
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
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-lg font-bold text-yellow-400">Premium</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile Search Button */}
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
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

      {/* Desktop Search Bar - Centered */}
      <div className="hidden md:block bg-black px-4 py-6 border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-400 px-6 py-4 pr-12 rounded-full text-lg focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto bg-black border-b border-gray-800 px-4">
        {['Videos', 'VR Porn', 'Categories', 'Pornstars', 'Channels', 'Community'].map((tab, index) => {
          if (tab === 'VR Porn') {
            return (
              <Link
                key={tab}
                to="/premium/vr"
                className="flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-400 hover:text-white"
              >
                {tab}
              </Link>
            );
          }
          if (tab === 'Categories') {
            return (
              <button
                key={tab}
                onClick={() => setIsCategoriesModalOpen(true)}
                className="flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-400 hover:text-white"
              >
                {tab}
              </button>
            );
          }
          if (tab === 'Pornstars') {
            return (
              <Link
                key={tab}
                to="/premium/creators/individual"
                className="flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-400 hover:text-white"
              >
                {tab}
              </Link>
            );
          }
          if (tab === 'Channels') {
            return (
              <Link
                key={tab}
                to="/premium/creators/studio"
                className="flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-400 hover:text-white"
              >
                {tab}
              </Link>
            );
          }
          if (tab === 'Community') {
            return (
              <button
                key={tab}
                onClick={() => setActiveTab('community')}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'community'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />
                {tab}
              </button>
            );
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab('videos')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                index === 0 && activeTab === 'videos'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Filter Chips - Only show for videos tab */}
      {activeTab === 'videos' && (
        <div className="flex space-x-2 px-4 py-3 bg-black overflow-x-auto">
          {filters.map((filter) => {
            const IconComponent = filter.icon;
            const isSelected = selectedFilter === filter.id;

            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                  isSelected
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <IconComponent className="w-3 h-3" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Title */}
      <div className="px-4 py-3 bg-black">
        {activeTab === 'videos' ? (
          <h2 className="text-lg font-bold text-white">Full-Length Premium Videos</h2>
        ) : (
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Premium Community Feed</h2>
              {user ? (
                <p className="text-sm text-gray-400">Exclusive content from your favorite creators</p>
              ) : (
                <p className="text-sm text-gray-400">Sign in to see community posts</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-black min-h-screen">
        {activeTab === 'videos' ? (
          // Videos Content
          <>
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
                  {searchTerm ? 'No videos found' : 'Premium Content Coming Soon'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {searchTerm 
                    ? `No videos match "${searchTerm}". Try different keywords.`
                    : 'Exclusive premium videos will be available shortly.'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Grid Layout - Hidden on Mobile */}
                <div className="hidden md:block">
                  <div className="px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                      {filteredVideos.map((video, index) => (
                        <Link key={video.id} to={`/premium/video/${video.id}`} className="block w-full group hover:bg-muted/5 transition-all duration-200">
                          <div
                            className="relative bg-muted overflow-hidden rounded-xl w-full"
                            style={{
                              aspectRatio: '16/9',
                              height: 'auto'
                            }}
                          >
                            <img
                              src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
                              alt={video.title}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              loading="lazy"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {video.duration || '15:30'}
                            </div>
                            {/* Premium Crown Badge */}
                            <div className="absolute top-2 left-2 z-20">
                              <Crown className="w-4 h-4 text-yellow-400" />
                            </div>
                          </div>
                          <div className="pt-3 space-y-2">
                            <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-white">{video.title}</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {(video.profiles?.avatar_url || video.uploader_avatar) ? (
                                  <img
                                    src={video.profiles?.avatar_url || video.uploader_avatar}
                                    alt={video.uploader_username || "Creator"}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">
                                    {(video.uploader_username || video.profiles?.username || video.uploader_name || "U").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs text-gray-300">
                                  {video.uploader_username || video.uploader_name || "Premium Creator"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {video.views || 0} views
                              </span>
                              <span className="flex items-center">
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                {video.likes || 0}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Full-Width Layout - Visible on Mobile Only */}
                <div className="block md:hidden">
                  <div className="space-y-0">
                    {filteredVideos.map((video, index) => (
                      <Link key={video.id} to={`/premium/video/${video.id}`} className="block">
                        <div className="bg-black">
                          {/* Video Thumbnail */}
                          <div className="relative aspect-video">
                            <img
                              src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />

                            {/* Duration */}
                            <div className="absolute bottom-3 right-3">
                              <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">
                                {video.duration || '15:30'}
                              </span>
                            </div>
                          </div>

                          {/* Video Info Card */}
                          <div className="p-4">
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
                                <p className="text-gray-300 text-xs">
                                  {video.uploader_username || video.uploader_name || "Premium Creator"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center py-6 px-4">
                    <ImageStylePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      theme="yellow"
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // Community Feed Content
          <div className="max-w-2xl mx-auto">
            {!user ? (
              <div className="text-center py-12 px-4">
                <Users className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Sign In Required</h3>
                <p className="text-gray-400 text-sm mb-6">
                  You need to be signed in to view the premium community feed
                </p>
                <Button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  Sign In Now
                </Button>
              </div>
            ) : feedLoading ? (
              <div className="space-y-4 p-4">
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                  <p className="text-yellow-400 text-sm mt-2">Loading premium feed...</p>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-900 rounded-lg p-4 h-32"></div>
                ))}
              </div>
            ) : feedPosts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No Premium Posts Yet</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Subscribe to premium creators to see their posts in your feed
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => window.location.href = '/premium/creators/individual'}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-sm"
                  >
                    Browse Creators
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/premium/creators/studio'}
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black text-sm"
                  >
                    Browse Studios
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="text-center pb-4">
                  <p className="text-yellow-400 text-sm">
                    Showing {feedPosts.length} premium post{feedPosts.length !== 1 ? 's' : ''} from your subscriptions
                  </p>
                </div>
                {feedPosts.map((post) => (
                  <div key={post.id} className="relative bg-gradient-to-br from-gray-900 to-black border border-yellow-500/20 rounded-lg overflow-hidden">
                    <CreatorPostCard
                      post={post}
                      onPostUpdate={loadFeedPosts}
                      className="border-none bg-transparent"
                    />
                    {/* Premium Badge Overlay */}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-2 py-1 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        PREMIUM
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 safe-area-bottom">
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center py-2 px-4">
            <Play className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Videos</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4">
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Search</span>
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
        videos={videos}
        onSearchChange={(term) => setSearchTerm(term)}
      />

      {/* Categories Modal */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      {/* Premium Page Footer */}
      <PremiumPageFooter />
    </div>
  );
};

export default PremiumPage;