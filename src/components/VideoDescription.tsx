import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VideoDescriptionProps {
  description: string | null;
}

const VideoDescription: React.FC<VideoDescriptionProps> = ({ description }) => {
  if (!description) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default VideoDescription;