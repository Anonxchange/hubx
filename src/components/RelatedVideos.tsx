import React from 'react';
import { Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdComponent from '@/components/AdComponent';
import RelatedVideoCard from '@/components/RelatedVideoCard';

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
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({
  videos,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Related Videos</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>
        {videos.map((video, index) => (
          <React.Fragment key={video.id}>
            <RelatedVideoCard video={video} viewMode={viewMode} />
            {/* Insert ad after 6th related video (index 5) */}
            {index === 5 && (
              <div className="my-4">
                <AdComponent zoneId="5661270" />
              </div>
            )}
          </React.Fragment>
        ))}
        
        {videos.length === 0 && (
          <p className="text-muted-foreground text-sm">No related videos found</p>
        )}
      </div>
    </div>
  );
};

export default RelatedVideos;