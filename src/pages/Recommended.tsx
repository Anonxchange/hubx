import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

interface Video {
  uuid: string;               // good unique key type
  title: string;              // string title
  thumbnail_url: string;      // thumbnail image url
  video_url: string;          // video url (not used in rendering but good to have)
  views: number;              // views count, used for ordering
  tags: string[];             // assuming tags is an array, confirm with DB
}

const Recommended: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);    // state for videos array
  const [loading, setLoading] = useState<boolean>(true); // loading state for UX
  const [error, setError] = useState<string | null>(null); // error state for UX

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .order("views", { ascending: false })
          .limit(20);

        if (error) throw error;

        setVideos(data as Video[]);
      } catch (err: any) {
        setError(err.message || "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <p>Loading recommended videos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Recommended Videos</h1>
      <div
        className="video-grid"
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {videos.map((video) => (
          <div
            key={video.uuid}
            className="video-card"
            style={{ border: "1px solid #ccc", padding: "0.5rem" }}
          >
            <img
              src={video.thumbnail_url}
              alt={video.title || "video thumbnail"}
              style={{ width: "100%", height: "auto", borderRadius: "4px" }}
              loading="lazy"
            />
            <p>{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommended;