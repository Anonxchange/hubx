
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  tags: string[];
  views: number;
  uploadDate: string;
  previewUrl?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  id,
  title,
  thumbnail,
  duration,
  tags,
  views,
  uploadDate,
  previewUrl
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && previewUrl) {
      videoRef.current.play().catch(() => {
        // Handle autoplay restrictions
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatTagForUrl = (tag: string) => {
    return tag.toLowerCase().replace(' ', '-');
  };

  const formatTagForDisplay = (tag: string) => {
    return tag.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div 
      className="video-card group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/video/${id}`} className="block">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          {/* Thumbnail */}
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: isHovering && previewLoaded ? 0 : 1 }}
          />
          
          {/* Preview Video */}
          {previewUrl && (
            <video
              ref={videoRef}
              src={previewUrl}
              muted
              loop
              playsInline
              className={`absolute inset-0 w-full h-full object-cover video-preview transition-opacity duration-300 ${
                isHovering && previewLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoadedData={() => setPreviewLoaded(true)}
            />
          )}
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {duration}
          </div>
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-primary/20 backdrop-blur-sm rounded-full p-4">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        {/* Video Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatViews(views)} views</span>
            <span>{formatDate(uploadDate)}</span>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-2 py-0 hover:bg-primary/20 transition-colors"
              >
                {formatTagForDisplay(tag)}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;
