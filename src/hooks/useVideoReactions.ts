
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reactToVideo, getUserReaction } from '@/services/videosService';

export const useVideoReaction = (videoId: string) => {
  const queryClient = useQueryClient();

  const { data: userReaction } = useQuery({
    queryKey: ['video', 'reaction', videoId],
    queryFn: () => getUserReaction(videoId),
    enabled: !!videoId,
  });

  const reactionMutation = useMutation({
    mutationFn: ({ videoId, reactionType }: { videoId: string; reactionType: 'like' | 'dislike' }) =>
      reactToVideo(videoId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', 'reaction', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    },
  });

  return {
    userReaction,
    reactToVideo: reactionMutation.mutate,
    isLoading: reactionMutation.isPending,
  };
};
