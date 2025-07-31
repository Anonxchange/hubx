
import React from 'react';
import VideoCard from './VideoCard';
import AdComponent from './AdComponent';

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

interface VideoGridProps {
  videos: Video[];
  viewMode?: 'grid' | 'list';
  showAds?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, viewMode = 'grid', showAds = false }) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No videos found</h2>
        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {videos.map((video, index) => (
          <div key={video.id}>
            <VideoCard video={video} viewMode="list" />
            {/* Insert ad after video 15 (index 14) */}
            {showAds && index === 14 && (
              <div className="my-6">
                <AdComponent zoneId="5661270" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video, index) => (
        <div key={video.id}>
          <VideoCard video={video} viewMode="grid" />
          {/* Insert ad after video 15 (index 14) - spanning full width */}
          {showAds && index === 14 && (
            <div className="col-span-full my-6">
              <AdComponent zoneId="5661270" />
            </div>
          )}
          {/* Insert JuicyAds after video 40 (index 39) - spanning full width */}
          {showAds && index === 39 && (
            <div className="col-span-full my-6 flex justify-center">
              <div dangerouslySetInnerHTML={{
                __html: `
                  <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
                  <ins id="1097666" data-width="300" data-height="250"></ins>
                  <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1097666});</script>
                `
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
