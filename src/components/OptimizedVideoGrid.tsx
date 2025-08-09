import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ThumbsUp, Clock } from "lucide-react";
import LazyImage from "@/components/LazyImage";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes?: number | null;
  created_at: string;
}

interface OptimizedVideoCardProps {
  video: Video;
  view: "grid" | "list";
}

function formatViews(views: number | null) {
  if (!views) return "0";
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return views.toString();
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

const OptimizedVideoCard: React.FC<OptimizedVideoCardProps> = ({ video, view }) => {
  if (view === "list") {
    return (
      <Link to={`/video/${video.id}`} className="block">
        <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden flex">
          {/* Thumbnail */}
          <div className="relative w-[260px] h-[150px] bg-muted overflow-hidden rounded-md flex-shrink-0">
            <LazyImage
              src={video.thumbnail_url || "https://via.placeholder.com/260x150?text=No+Thumbnail"}
              alt={video.title}
              width={260}
              height={150}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            />
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>

          {/* Title + meta */}
          <CardContent className="p-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {video.title}
              </h3>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {formatViews(video.views)}
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {video.likes || 0}
                </span>
              </div>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(video.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Grid mode
  return (
    <Link to={`/video/${video.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        {/* Thumbnail */}
        <div className="relative w-full h-[150px] bg-muted overflow-hidden rounded-md">
          <LazyImage
            src={video.thumbnail_url || "https://via.placeholder.com/260x150?text=No+Thumbnail"}
            alt={video.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        </div>

        {/* Title + meta */}
        <CardContent className="p-2 space-y-2">
          <h3 className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {formatViews(video.views)}
              </span>
              <span className="flex items-center">
                <ThumbsUp className="w-3 h-3 mr-1" />
                {video.likes || 0}
              </span>
            </div>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(video.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default OptimizedVideoCard;