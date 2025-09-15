import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Generate or get anonymous session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('user_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('user_session', sessionId);
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

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user reaction:', error);
    return null;
  }
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

  // Update video reaction counts
  await updateVideoReactionCounts(videoId);
};

// React (like/dislike) a video
export const reactToVideo = async (videoId: string, reactionType: 'like' | 'dislike') => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  // Check if user already has a reaction
  const { data: existingReaction } = await supabase
    .from('video_reactions')
    .select('*')
    .eq('video_id', videoId)
    .eq('user_session', sessionId)
    .single();

  if (existingReaction) {
    // Update existing reaction
    const { error } = await supabase
      .from('video_reactions')
      .update({ reaction_type: reactionType })
      .eq('id', existingReaction.id);

    if (error) throw error;
  } else {
    // Create new reaction
    const { error } = await supabase
      .from('video_reactions')
      .insert({ video_id: videoId, user_session: sessionId, reaction_type: reactionType });

    if (error) throw error;
  }

  // Update video reaction counts
  await updateVideoReactionCounts(videoId);
};

// Helper function to update video reaction counts
const updateVideoReactionCounts = async (videoId: string) => {
  const { data: reactions } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId);

  if (reactions) {
    const likes = reactions.filter((r) => r.reaction_type === 'like').length;
    const dislikes = reactions.filter((r) => r.reaction_type === 'dislike').length;

    await supabase
      .from('videos')
      .update({ likes, dislikes })
      .eq('id', videoId);
  }
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