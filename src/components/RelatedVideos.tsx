import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdComponent from '@/components/AdComponent';
import OptimizedRelatedVideoCard from '@/components/OptimizedRelatedVideoCard';
import CommentSection from '@/components/CommentSection';
import Footer from '@/components/Footer';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
  tags?: string[] | null;
  category?: string | null;
}

interface RelatedVideosProps {
  videos: Video[];
  currentVideo?: Video;
  videoId?: string;
  premiumVideos?: Video[];
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({ videos, currentVideo, videoId, premiumVideos = [] }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeTab, setActiveTab] = useState('related');

  // Load the ad script asynchronously once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://a.magsrv.com/ad-provider.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      (window as any).AdProvider = (window as any).AdProvider || [];
      (window as any).AdProvider.push({ serve: {} });
    };
  }, []);

  // Function to calculate relatedness score
  const calculateRelatedness = (video: Video, current: Video): number => {
    let score = 0;

    if (video.category && current.category && video.category === current.category) {
      score += 5;
    }

    if (video.tags && current.tags) {
      const commonTags = video.tags.filter(tag => current.tags?.includes(tag));
      score += commonTags.length * 2;
    }

    if (video.title && current.title) {
      const videoWords = video.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const currentWords = current.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const commonWords = videoWords.filter(word => currentWords.includes(word));
      score += commonWords.length * 0.5;
    }

    return score;
  };

  // Filter and sort videos by relatedness
  const filteredVideos = currentVideo
    ? videos
        .filter(video => video.id !== currentVideo.id)
        .map(video => ({
          ...video,
          relatednessScore: calculateRelatedness(video, currentVideo)
        }))
        .sort((a, b) => b.relatednessScore - a.relatednessScore)
        .filter(video => video.relatednessScore > 0)
    : videos;

  const maxVisible = Math.min(30, filteredVideos.length);
  const canShowMore = visibleCount < maxVisible;

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, maxVisible));
  };

  const displayedVideos = filteredVideos.slice(0, visibleCount);

  const tabs = [
    { id: 'related', label: 'Related' },
    { id: 'recommend', label: 'Recommend' },
    { id: 'comment', label: 'Comment' },
    { id: 'playlist', label: 'Playlist' },
  ];

  return (
    <div className="space-y-6">
      {/* Horizontal Scroll Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 min-w-max">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'comment' ? (
        /* Comments Section */
        <div className="space-y-6">
          {videoId && <CommentSection videoId={videoId} />}
          {!videoId && (
            <p className="text-muted-foreground text-sm">Video ID not available for comments</p>
          )}
        </div>
      ) : (
        /* Videos content */
        <div className="space-y-6">
          {/* Horizontal Premium Videos Section - At the top */}
          {activeTab === 'related' && premiumVideos.length > 0 && (
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                {premiumVideos.slice(0, 6).map((premiumVideo, index) => (
                  <div key={`premium-${premiumVideo.id}-${index}`} className="flex-shrink-0 w-64 relative">
                    <Link to={`/premium/video/${premiumVideo.id}`} className="block w-full group hover:bg-muted/5 transition-all duration-200">
                      <div
                        className="relative bg-muted overflow-hidden rounded-xl w-full"
                        style={{ 
                          aspectRatio: '16/9', 
                          height: 'auto'
                        }}
                      >
                        <img
                          src={premiumVideo.thumbnail_url || '/placeholder-thumbnail.jpg'}
                          alt={premiumVideo.title}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          loading="lazy"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {premiumVideo.duration}
                        </div>
                        {/* Crown icon overlay */}
                        <div className="absolute top-2 left-2 z-20">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="pt-3 space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">{premiumVideo.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-bold">
                              {(premiumVideo.title || 'U')[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Creator
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                            </svg>
                            {premiumVideo.views || 0} views
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                            </svg>
                            {premiumVideo.likes || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              {/* Gradient fade on right edge */}
              <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
            </div>
          )}

          {/* Regular Videos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedVideos.map((video, index) => (
              <div key={video.id}>
                <OptimizedRelatedVideoCard video={video} viewMode="grid" />
                {index === 5 && (
                  <div className="my-4 md:hidden">
                    {/* Ad placeholder, script loads via useEffect */}
                    <ins className="eas6a97888e37" data-zoneid="5686642"></ins>
                  </div>
                )}
              </div>
            ))}

            {/* Show More Button */}
            {canShowMore && (
              <div className="col-span-full flex justify-center my-6">
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-orange-500 transition-colors px-8 py-2 rounded-lg"
                >
                  Show More ({Math.min(10, maxVisible - visibleCount)} more videos)
                </Button>
              </div>
            )}

            {/* Last ad after all videos */}
            {filteredVideos.length > 0 && visibleCount >= filteredVideos.length && (
              <div className="my-4">
                <AdComponent zoneId="5661270" />
              </div>
            )}

            {filteredVideos.length === 0 && (
              <p className="text-muted-foreground text-sm">No related videos found</p>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RelatedVideos;