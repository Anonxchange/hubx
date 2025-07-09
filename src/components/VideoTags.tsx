import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface VideoTagsProps {
  tags: string[];
}

const VideoTags: React.FC<VideoTagsProps> = ({ tags }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link key={tag} to={`/category/${tag.toLowerCase()}`}>
          <Badge 
            variant="secondary" 
            className="hover:bg-primary/20 transition-colors cursor-pointer"
          >
            {tag}
          </Badge>
        </Link>
      ))}
    </div>
  );
};

export default VideoTags;