
import React from 'react';
import { Music, Play, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlaylists, useDeletePlaylist } from '@/hooks/usePlaylists';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const PlaylistsPage: React.FC = () => {
  const { data: playlists, isLoading, error } = usePlaylists();
  const deletePlaylistMutation = useDeletePlaylist();

  // Debug logging
  React.useEffect(() => {
    console.log('Playlists data:', playlists);
    console.log('Playlists loading:', isLoading);
    console.log('Playlists error:', error);
  }, [playlists, isLoading, error]);

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (window.confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      try {
        await deletePlaylistMutation.mutateAsync(playlistId);
        toast.success('Playlist deleted successfully');
      } catch (error) {
        toast.error('Failed to delete playlist');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Music className="w-8 h-8 mr-3" />
        <h1 className="text-3xl font-bold">My Playlists</h1>
      </div>

      {playlists?.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No playlists yet</h2>
          <p className="text-muted-foreground mb-4">
            Start creating playlists by clicking the + button on any video
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists?.map((playlist) => (
            <Card key={playlist.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{playlist.name}</CardTitle>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {playlist.is_public ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {playlist.video_count} videos
                    </Badge>
                    <Badge variant={playlist.is_public ? "default" : "outline"}>
                      {playlist.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/playlist/${playlist.id}`}>
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                      disabled={deletePlaylistMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {new Date(playlist.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
