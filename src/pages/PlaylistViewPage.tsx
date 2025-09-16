import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Clock, Eye, Heart, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

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

  // Check if current user is the playlist owner
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user && playlistData?.playlist) {
        setIsOwner(user.id === playlistData.playlist.user_id);
      }
    };
    
    checkAuth();
  }, [playlistData?.playlist]);

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const handleRemoveVideo = async (videoId: string, videoTitle: string) => {
    if (!id) return;

    if (window.confirm(`Remove "${videoTitle}" from this playlist?`)) {
      try {
        const { error } = await supabase
          .from('playlist_items')
          .delete()
          .eq('playlist_id', id)
          .eq('video_id', videoId);

        if (error) throw error;

        // Invalidate and refetch the playlist data
        queryClient.invalidateQueries({ queryKey: ['playlist-view', id] });
        toast.success('Video removed from playlist');
      } catch (error) {
        console.error('Error removing video from playlist:', error);
        toast.error('Failed to remove video from playlist');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-6">
          <div className="px-4 animate-pulse space-y-4">
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
        <main className="py-6">
          <div className="px-4 text-center py-12">
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
      <main className="py-6">
        {/* Playlist Header */}
        <div className="mb-8 px-4">
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
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {videos.map((item: PlaylistVideo, index) => (
              <div key={item.videos.id} className="relative group">
                <Link
                  to={`/video/${item.videos.id}`}
                  className="block w-full group hover:bg-muted/5 transition-all duration-200"
                >
                  <div className="relative bg-muted overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={item.videos.thumbnail_url || "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop"}
                      alt={item.videos.title}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                    />

                    {/* Playlist position badge */}
                    <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-bold">
                      #{index + 1}
                    </div>

                    {/* Duration badge */}
                    {item.videos.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {item.videos.duration}
                      </div>
                    )}

                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    {/* Creator info above title */}
                    {item.videos.profiles && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {item.videos.profiles.username}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">
                      {item.videos.title}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {item.videos.views?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {item.videos.likes?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Remove button - only visible to playlist owner */}
                {isOwner && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveVideo(item.videos.id, item.videos.title);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Empty Playlist</h2>
            <p className="text-muted-foreground">This playlist doesn't have any videos yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlaylistViewPage;