import React, { useState } from 'react';
import { X, Play, Eye, Clock, DollarSign, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useVideos } from '@/hooks/useVideos';

interface RecommendedVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecommendedVideosModal: React.FC<RecommendedVideosModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useVideos(1, 20, 'recommended');
  const { videos = [] } = data || {};

  // Filter videos based on search term
  const filteredVideos = videos.filter(video => 
    searchTerm === '' || 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.channelName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-black border border-gray-800 text-white p-0 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-bold text-yellow-400">Recommended Premium</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search recommended videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="w-20 h-12 bg-gray-800 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-8 px-4">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchTerm ? `No videos match "${searchTerm}"` : 'No recommended videos available'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredVideos.map((video) => (
                <Link
                  key={video.id}
                  to={`/premium/video/${video.id}`}
                  onClick={onClose}
                  className="flex space-x-3 hover:bg-gray-900 p-2 rounded transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-12 flex-shrink-0">
                    <img
                      src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=120&fit=crop'}
                      alt={video.title}
                      className="w-full h-full object-cover rounded"
                    />
                    {/* Duration overlay */}
                    <div className="absolute bottom-1 right-1">
                      <span className="bg-black/80 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                        {video.duration || '15:30'}
                      </span>
                    </div>
                    {/* Premium badge */}
                    <div className="absolute top-1 left-1">
                      <DollarSign className="w-3 h-3 text-yellow-400" />
                    </div>
                  </div>

                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium line-clamp-2 leading-tight mb-1">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-1">
                      {video.uploader_username || video.uploader_name || 'Premium Creator'}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{(video.views || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{video.duration || '15:30'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <Link
            to="/premium"
            onClick={onClose}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium py-2 px-4 rounded transition-colors text-center block"
          >
            View All Premium Videos
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendedVideosModal;