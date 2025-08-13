
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserPlaylists,
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  isVideoInPlaylist,
  getPlaylistVideos,
  deletePlaylist
} from '@/services/playlistService';

export const usePlaylists = () => {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: getUserPlaylists,
  });
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description, isPublic }: { name: string; description?: string; isPublic?: boolean }) =>
      createPlaylist(name, description, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
};

export const useAddToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      addVideoToPlaylist(playlistId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
};

export const useRemoveFromPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      removeVideoFromPlaylist(playlistId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
};

export const usePlaylistVideos = (playlistId: string) => {
  return useQuery({
    queryKey: ['playlist', 'videos', playlistId],
    queryFn: () => getPlaylistVideos(playlistId),
    enabled: !!playlistId,
  });
};

export const useVideoInPlaylist = (playlistId: string, videoId: string) => {
  return useQuery({
    queryKey: ['playlist', 'video', playlistId, videoId],
    queryFn: () => isVideoInPlaylist(playlistId, videoId),
    enabled: !!playlistId && !!videoId,
  });
};

export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
};
