
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Crown, Play, Eye, Clock, DollarSign, Search, User, Heart, Settings } from 'lucide-react';
import PremiumVideoCard from '@/components/PremiumVideoCard';
import { useVideos } from '@/hooks/useVideos';
import ImageStylePagination from '@/components/ImageStylePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PremiumPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'originals' | 'top-creator' | 'best-vids'>('all');
  
  const { data, isLoading, error } = useVideos(
    currentPage,
    60,
    'premium'
  );

  const { videos = [], totalPages = 0, totalCount = 0 } = data || {};

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
            <Search className="w-5 h-5 text-gray-400" />
            <div className="relative">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
                20
              </Badge>
            </div>
            <User className="w-5 h-5 text-gray-400" />
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1 h-7">
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
              index === 0 
                ? 'text-yellow-400 border-b-2 border-yellow-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Chips */}
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

      {/* Content Title */}
      <div className="px-4 py-3 bg-black">
        <h2 className="text-lg font-bold text-white">Full-Length Premium Videos</h2>
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
        ) : videos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-white">Premium Content Coming Soon</h3>
            <p className="text-gray-400 text-sm">Exclusive premium videos will be available shortly.</p>
          </div>
        ) : (
          <>
            {/* Full-width video grid - mobile style */}
            <div className="space-y-0">
              {videos.map((video, index) => (
                <div key={video.id} className="relative">
                  <Link to={`/premium/video/${video.id}`} className="block">
                    <div className="relative aspect-video bg-black">
                      <img
                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      
                      {/* Premium badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-yellow-500 text-black text-xs font-bold px-2 py-1">
                          <Crown className="w-3 h-3 mr-1" />
                          PREMIUM
                        </Badge>
                      </div>
                      
                      {/* Play button */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-black/50 text-white p-3 rounded-full">
                          <Play className="w-6 h-6" fill="currentColor" />
                        </div>
                      </div>
                      
                      {/* Video info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Crown className="w-4 h-4 text-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2">
                              {video.title}
                            </h3>
                            <p className="text-gray-300 text-xs">
                              Premium Creator
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Duration */}
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration || '15:30'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center py-6 px-4">
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
          <button className="flex flex-col items-center py-2 px-4">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
