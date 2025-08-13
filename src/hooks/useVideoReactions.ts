import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch the user's reaction for a video
export const getUserReaction = async (videoId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data?.reaction as 'like' | 'dislike' | null;
};

// React (like/dislike) a video
export const reactToVideo = async (videoId: string, reactionType: 'like' | 'dislike') => {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('User not logged in');

  const { error } = await supabase
    .from('video_reactions')
    .upsert(
      { video_id: videoId, user_id: user.id, reaction: reactionType },
      { onConflict: ['video_id', 'user_id'] }
    );

  if (error) throw error;
};

// Hook
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
    onMutate: async ({ reactionType }) => {
      await queryClient.cancelQueries({ queryKey: ['video', videoId] });
      const previousData: any = queryClient.getQueryData(['video', videoId]);

      // Optimistic update
      queryClient.setQueryData(['video', videoId], (old: any) => {
        const prevReaction = old?.userReaction;
        let likes = old?.likes ?? 0;
        let dislikes = old?.dislikes ?? 0;

        if (prevReaction === reactionType) {
          // Undo reaction
          if (reactionType === 'like') likes -= 1;
          else dislikes -= 1;
          return { ...old, likes, dislikes, userReaction: null };
        }

        if (reactionType === 'like') likes += 1;
        if (reactionType === 'dislike') dislikes += 1;

        if (prevReaction === 'like') likes -= 1;
        if (prevReaction === 'dislike') dislikes -= 1;

        return { ...old, likes, dislikes, userReaction: reactionType };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['video', videoId], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', 'reaction', videoId] });
    },
  });

  return {
    userReaction,
    reactToVideo: reactionMutation.mutate,
    isLoading: reactionMutation.isLoading,
  };
};