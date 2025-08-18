
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVideos } from '@/services/videosService';

const MomentsCarousel = () => {
  const queryClient = useQueryClient();
  
  const { data: momentsData, isLoading, refetch } = useQuery({
    queryKey: ['moments-carousel'],
    queryFn: () => getVideos(1, 6, undefined, undefined, true), // Get 6 moments
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    cacheTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 1000 * 60 * 3, // Refetch every 3 minutes (much less frequent)
  });

  const moments = momentsData?.videos || [];

  const handleRefresh = () => {
    // Invalidate all moments-related queries
    queryClient.invalidateQueries({ queryKey: ['moments'] });
    queryClient.invalidateQueries({ queryKey: ['moments-carousel'] });
    queryClient.invalidateQueries({ queryKey: ['videos'] }); // Also invalidate general videos cache
    refetch();
  };

  if (isLoading || moments.length === 0) {
    return null; // Don't show the section if loading or no moments
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Moments</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-white"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="/moments">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View More
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {moments.map((moment) => (
          <Link
            key={moment.id}
            to={`/moments?start=${moment.id}`}
            className="flex-shrink-0 w-48 group"
          >
            <Card className="bg-card hover:bg-card/80 transition-colors border-border/50">
              <div className="relative aspect-[9/16] overflow-hidden rounded-t-lg">
                <video
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={moment.video_url}
                  poster={moment.thumbnail_url}
                  muted
                  playsInline
                />
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {moment.duration}
                </div>

                {/* Moments badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold">
                    Moment
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 leading-tight text-white">
                  {moment.title}
                </h3>
                
                {/* Creator profile */}
                {moment.uploader_username && (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {moment.uploader_username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      @{moment.uploader_username}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCount(moment.views)} views</span>
                  <span>{formatCount(moment.likes)} likes</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MomentsCarousel;
