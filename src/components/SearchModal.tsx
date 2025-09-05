import React, { useState, useEffect } from 'react';
import { X, Search, Play, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreatorProfileCard from '@/components/CreatorProfileCard';
import { searchCreators, CreatorProfile } from '@/services/creatorSearchService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: any[];
  onSearchChange?: (searchTerm: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, videos, onSearchChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState(videos);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredVideos(videos);
      setCreators([]);
    } else {
      // Filter videos - search across title, description, channel name, uploader username, and tags
      const filtered = videos.filter(video => 
        video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.channelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.uploader_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(video.tags) && video.tags.some((tag: string) => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
      setFilteredVideos(filtered);

      // Search creators
      setIsSearchingCreators(true);
      searchCreators(searchTerm)
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
    }
    onSearchChange?.(searchTerm);
  }, [searchTerm, videos, onSearchChange]);

  const handleClose = () => {
    setSearchTerm('');
    setFilteredVideos(videos);
    setCreators([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full bg-black border border-gray-800 text-white p-0 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Search Premium Videos</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos by title, description, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {searchTerm === '' ? (
            <div className="text-center py-12 px-4">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Start typing to search for creators and videos...</p>
            </div>
          ) : creators.length === 0 && filteredVideos.length === 0 && !isSearchingCreators ? (
            <div className="text-center py-12 px-4">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2 text-white">No results found</h3>
              <p className="text-gray-400">No creators or videos match "{searchTerm}". Try different keywords.</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Results summary */}
              <div className="mb-4 text-sm text-gray-400">
                {creators.length > 0 && (
                  <span>{creators.length} creator{creators.length !== 1 ? 's' : ''}</span>
                )}
                {creators.length > 0 && filteredVideos.length > 0 && <span> and </span>}
                {filteredVideos.length > 0 && (
                  <span>{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}</span>
                )}
                <span> found</span>
              </div>

              {/* Creator Results First */}
              {creators.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    Creators
                  </h3>
                  <div className="space-y-3">
                    {creators.map((creator) => (
                      <CreatorProfileCard 
                        key={creator.id} 
                        creator={creator} 
                        onClose={handleClose} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Video Results Below */}
              {filteredVideos.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    Videos
                  </h3>
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <Link
                    key={video.id}
                    to={`/premium/video/${video.id}`}
                    onClick={handleClose}
                    className="flex space-x-4 hover:bg-gray-900 p-3 rounded transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-32 h-20 flex-shrink-0">
                      <img
                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
                        alt={video.title}
                        className="w-full h-full object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1">
                        <span className="bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                          {video.duration || '15:30'}
                        </span>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {video.uploader_username || video.channelName || 'Unknown Creator'}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{video.views?.toLocaleString() || '0'} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Recently'}</span>
                        </div>
                      </div>
                      {video.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;