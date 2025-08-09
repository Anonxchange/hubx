import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

interface Video {
  uuid: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  views: number;
  tags: string[];
}

const Recommended: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("Fetching videos from Supabase...");
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .order("views", { ascending: false })
          .limit(20);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Fetched videos:", data);
        setVideos(data as Video[]);
      } catch (err: any) {
        console.error("Error fetching videos:", err);
        setError(err.message || "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-2">Loading recommended videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No videos available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Recommended Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div
            key={video.uuid}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => handleVideoClick(video.uuid)}
          >
            <div className="relative">
              <img
                src={video.thumbnail_url}
                alt={video.title || "Video thumbnail"}
                className="w-full h-48 object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/320x180?text=No+Image";
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {video.views.toLocaleString()} views
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                {video.title}
              </h3>
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommended;