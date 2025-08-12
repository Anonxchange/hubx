import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface VideoTagsProps {
  tags: string[];
}

const VideoTags = ({ tags }: VideoTagsProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Remove duplicates and filter empty tags
  const uniqueTags = Array.from(new Set(tags.filter(tag => tag && tag.trim())));

  return (
    <div className="flex flex-wrap gap-2">
      {uniqueTags.map((tag, index) => (
        <Badge key={`tag-${index}-${tag.replace(/\s+/g, '-').toLowerCase()}`} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default VideoTags;