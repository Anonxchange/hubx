import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AdComponent from '@/components/AdComponent';
import OptimizedRelatedVideoCard from '@/components/OptimizedRelatedVideoCard';
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
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({ videos, currentVideo }) => {
  const [visibleCount, setVisibleCount] = useState(20);
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
    setVisibleCount(prev => Math.min(prev + 20, maxVisible));
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

      {/* Videos grid */}
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

      <Footer />
    </div>
  );
};

export default RelatedVideos;