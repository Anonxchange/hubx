
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp, Crown, Star, Shield, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
}

interface PremiumVideoCardProps {
  video: Video;
  viewMode?: 'grid' | 'list';
}

const PremiumVideoCard: React.FC<PremiumVideoCardProps> = ({ video, viewMode = 'grid' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
      if (videoRef.current && video.preview_url) {
        videoRef.current.play().catch(console.error);
      }
    }, 800);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Link to={`/premium/video/${video.id}`} className="block">
        <Card className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden border-purple-500/20 bg-gradient-to-br from-black/80 to-purple-900/20">
        <div 
          className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-black overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Premium Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-purple-900/30 z-10"></div>
          
          {/* Premium Badge */}
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-3 py-1 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              PREMIUM
            </Badge>
          </div>

          {/* Quality Badge */}
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-2 py-1 text-xs">
              4K
            </Badge>
          </div>

          <img
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
            alt={video.title}
            className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {video.preview_url && (
            <video
              ref={videoRef}
              src={video.preview_url}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'}`}
              muted
              loop
              playsInline
              preload="metadata"
            />
          )}
          
          {/* Duration */}
          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded z-20">
            {video.duration}
          </div>

          {/* VIP Status */}
          {showPreview && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-black px-4 py-2 rounded-full animate-pulse">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span className="font-bold text-sm">VIP PREVIEW</span>
                  <Star className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* Play Button Overlay */}
          {isHovered && !showPreview && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white p-4 rounded-full hover:scale-110 transition-transform">
                <Play className="w-8 h-8" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Premium Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-purple-500/10 to-orange-500/0 group-hover:via-purple-500/20 transition-all duration-300 z-5"></div>
        </div>
        
        <CardContent className="p-4 space-y-3 bg-gradient-to-br from-black/90 to-purple-900/20">
          <h3 className="font-bold line-clamp-2 leading-tight group-hover:text-yellow-400 transition-colors text-white">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-300">
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {formatViews(video.views)}
              </span>
              <span className="flex items-center">
                <ThumbsUp className="w-3 h-3 mr-1" />
                {video.likes || 0}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-400">{formatDate(video.created_at)}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} className="bg-purple-600/50 text-purple-100 border-purple-500/30 text-xs">
                {tag}
              </Badge>
            ))}
            {video.tags.length > 2 && (
              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                +{video.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Premium Status Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
            <div className="flex items-center space-x-2">
              <Crown className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">PREMIUM EXCLUSIVE</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">HD</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PremiumVideoCard;
