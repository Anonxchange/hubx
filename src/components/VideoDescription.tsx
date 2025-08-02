
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeUserInput } from '@/utils/sanitization';

interface VideoDescriptionProps {
  description?: string;
  views: number;
  createdAt: string;
}

const VideoDescription = ({ description = '', views, createdAt }: VideoDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description) return null;

  // Sanitize the description to prevent XSS
  const sanitizedDescription = sanitizeUserInput(description);
  
  // Format the description with line breaks
  const formatDescription = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const truncatedDescription = sanitizedDescription.length > 200 
    ? sanitizedDescription.substring(0, 200) + '...' 
    : sanitizedDescription;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>{views.toLocaleString()} views</span>
        <span>{new Date(createdAt).toLocaleDateString()}</span>
      </div>
      
      <div className="text-gray-800 dark:text-gray-200">
        {isExpanded ? (
          <div>{formatDescription(sanitizedDescription)}</div>
        ) : (
          <div>{formatDescription(truncatedDescription)}</div>
        )}
      </div>

      {sanitizedDescription.length > 200 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              <span>Show more</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default VideoDescription;
