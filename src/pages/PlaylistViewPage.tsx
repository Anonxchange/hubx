
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Clock, Eye, Heart } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface PlaylistVideo {
  position: number;
  added_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: string | null;
    views: number | null;
    likes: number | null;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  };
}

const PlaylistViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: playlistData, isLoading, error } = useQuery({
    queryKey: ['playlist-view', id],
    queryFn: async () => {
      if (!id) throw new Error('Playlist ID is required');

      // Get playlist details
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .select(`
          id, name, description, is_public, created_at,
          user_id
        `)
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;

      // Get playlist videos
      const { data: videos, error: videosError } = await supabase
        .from('playlist_items')
        .select(`
          position,
          added_at,
          videos:video_id (
            id, title, thumbnail_url, duration, views, likes, created_at,
            profiles:owner_id (id, username, avatar_url)
          )
        `)
        .eq('playlist_id', id)
        .order('position', { ascending: true });

      if (videosError) throw videosError;

      return {
        playlist,
        videos: videos || []
      };
    },
    enabled: !!id,
  });

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <div className="aspect-video bg-muted"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !playlistData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Playlist Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The playlist you're looking for doesn't exist or is not public.
            </p>
            <Link to="/" className="text-primary hover:underline">
              Go back to homepage
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { playlist, videos } = playlistData;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Playlist Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground mb-4">{playlist.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{videos.length} videos</span>
            <span>Created {new Date(playlist.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Videos Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((item: PlaylistVideo, index) => (
              <Card
                key={item.videos.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleVideoClick(item.videos.id)}
              >
                <div className="relative">
                  <img
                    src={item.videos.thumbnail_url || "https://via.placeholder.com/320x180?text=No+Image"}
                    alt={item.videos.title}
                    className="w-full aspect-video object-cover rounded-t-lg"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                  {item.videos.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {item.videos.duration}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-30">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                    {item.videos.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{item.videos.views?.toLocaleString() || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{item.videos.likes?.toLocaleString() || 0}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Empty Playlist</h2>
            <p className="text-muted-foreground">This playlist doesn't have any videos yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlaylistViewPage;
