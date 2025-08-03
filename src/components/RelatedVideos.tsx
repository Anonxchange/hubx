import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdComponent from '@/components/AdComponent';
import RelatedVideoCard from '@/components/RelatedVideoCard';
import Footer from '@/components/Footer';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
}

interface RelatedVideosProps {
  videos: Video[];
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({ videos }) => {
  const [activeTab, setActiveTab] = useState('related');
  
  const tabs = [
    { id: 'related', label: 'Related' },
    { id: 'recommend', label: 'Recommend' },
    { id: 'comment', label: 'Comment' },
    { id: 'playlist', label: 'Playlist' }
  ];

  return (
    <div className="space-y-6">
      {/* Horizontal Scroll Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 min-w-max">
            {tabs.map((tab) => (
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video, index) => (
          <React.Fragment key={video.id}>
            <RelatedVideoCard video={video} viewMode="grid" />
            {/* Insert new ad after 6th related video (index 5) */}
            {index === 5 && (
              <div className="my-4">
                <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script>
                <ins className="eas6a97888e37" data-zoneid="5686642"></ins>
                <script dangerouslySetInnerHTML={{
                  __html: '(AdProvider = window.AdProvider || []).push({"serve": {}});'
                }}></script>
              </div>
            )}
          </React.Fragment>
        ))}
        
        {/* Move original ad to the last position */}
        {videos.length > 0 && (
          <div className="my-4">
            <AdComponent zoneId="5661270" />
          </div>
        )}
        
        {videos.length === 0 && (
          <p className="text-muted-foreground text-sm">No related videos found</p>
        )}
      </div>
      
      {/* Add Footer */}
      <Footer />
    </div>
  );
};

export default RelatedVideos;