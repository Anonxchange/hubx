import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

interface Video {
  uuid: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  views: number;
  tags: string[];
}

export default function Recommended() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    async function fetchVideos() {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("views", { ascending: false })
        .limit(20);

      if (error) {
        console.error(error);
      } else {
        setVideos(data as Video[]);
      }
    }

    fetchVideos();
  }, []);

  return (
    <div>
      <h1>Recommended Videos</h1>
      <div className="video-grid">
        {videos.map((video) => (
          <div key={video.uuid} className="video-card">
            <img src={video.thumbnail_url} alt={video.title} />
            <p>{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Recommended;