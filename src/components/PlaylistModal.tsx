import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaylists, useCreatePlaylist, useAddToPlaylist, useRemoveFromPlaylist, useVideoInPlaylist } from '@/hooks/usePlaylists';
import { toast } from 'sonner';

interface PlaylistModalProps {
  videoId: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({ videoId, children, open, onOpenChange }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data: playlists, isLoading } = usePlaylists();
  const createPlaylistMutation = useCreatePlaylist();
  const addToPlaylistMutation = useAddToPlaylist();
  const removeFromPlaylistMutation = useRemoveFromPlaylist();

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    try {
      await createPlaylistMutation.mutateAsync({
        name: newPlaylistName,
        description: newPlaylistDescription,
        isPublic,
      });

      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsPublic(false);
      setShowCreateForm(false);
      toast.success('Playlist created successfully!');
    } catch (error) {
      toast.error('Failed to create playlist');
    }
  };

  const handleToggleVideoInPlaylist = async (playlistId: string, isInPlaylist: boolean) => {
    try {
      if (isInPlaylist) {
        await removeFromPlaylistMutation.mutateAsync({ playlistId, videoId });
        toast.success('Video removed from playlist');
      } else {
        await addToPlaylistMutation.mutateAsync({ playlistId, videoId });
        toast.success('Video added to playlist');
      }
    } catch (error) {
      toast.error('Failed to update playlist');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to playlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Playlist Button */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new playlist
          </Button>

          {/* Create Playlist Form */}
          {showCreateForm && (
            <div className="space-y-3 p-4 border rounded-lg">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                rows={2}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <label htmlFor="public" className="text-sm">
                  Make public
                </label>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleCreatePlaylist}
                  disabled={createPlaylistMutation.isPending}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Playlists */}
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading playlists...
                </div>
              ) : playlists?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No playlists yet. Create one to get started!
                </div>
              ) : (
                playlists?.map((playlist) => (
                  <PlaylistItem
                    key={playlist.id}
                    playlist={playlist}
                    videoId={videoId}
                    onToggle={handleToggleVideoInPlaylist}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface PlaylistItemProps {
  playlist: any;
  videoId: string;
  onToggle: (playlistId: string, isInPlaylist: boolean) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ playlist, videoId, onToggle }) => {
  const { data: isInPlaylist, isLoading } = useVideoInPlaylist(playlist.id, videoId);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
      <div className="flex-1">
        <h4 className="font-medium">{playlist.name}</h4>
        <p className="text-sm text-muted-foreground">
          {playlist.video_count} videos
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(playlist.id, isInPlaylist || false)}
        disabled={isLoading}
        className="ml-2"
      >
        {isInPlaylist ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default PlaylistModal;