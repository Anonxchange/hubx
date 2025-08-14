import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Generate or get anonymous session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

// Fetch the user's reaction for a video
export const getUserReaction = async (videoId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId)
    .eq('user_session', sessionId)
    .single();

  if (error) return null;
  return data?.reaction_type as 'like' | 'dislike' | null;
};

// Remove a reaction
export const removeReaction = async (videoId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  const { error } = await supabase
    .from('video_reactions')
    .delete()
    .eq('video_id', videoId)
    .eq('user_session', sessionId);

  if (error) throw error;
};

// React (like/dislike) a video
export const reactToVideo = async (videoId: string, reactionType: 'like' | 'dislike') => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  const { error } = await supabase
    .from('video_reactions')
    .upsert(
      { video_id: videoId, user_session: sessionId, reaction_type: reactionType },
      { onConflict: 'video_id,user_session' }
    );

  if (error) throw error;
};

// Hook
export const useVideoReaction = (videoId: string) => {
  const queryClient = useQueryClient();

  const { data: userReaction, isLoading: reactionLoading } = useQuery({
    queryKey: ['video-reaction', videoId],
    queryFn: () => getUserReaction(videoId),
    enabled: !!videoId,
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ videoId, reactionType }: { videoId: string; reactionType: 'like' | 'dislike' }) => {
      // If clicking the same reaction, remove it
      if (userReaction === reactionType) {
        await removeReaction(videoId);
        return null;
      } else {
        await reactToVideo(videoId, reactionType);
        return reactionType;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['video-reaction', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    },
    onError: (error) => {
      console.error('Reaction mutation error:', error);
    },
  });

  return {
    userReaction,
    reactToVideo: reactionMutation.mutate,
    isLoading: reactionMutation.isPending || reactionLoading,
  };
};