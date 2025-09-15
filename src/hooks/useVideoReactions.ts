import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cache session ID to avoid repeated localStorage reads
let cachedSessionId: string | null = null;

const getSessionId = () => {
  if (cachedSessionId) return cachedSessionId;
  
  let sessionId = localStorage.getItem('user_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('user_session', sessionId);
  }
  cachedSessionId = sessionId;
  return sessionId;
};

// Fetch the user's reaction for a video
export const getUserReaction = async (videoId: string): Promise<'like' | 'dislike' | null> => {
  if (!videoId) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = user?.id || getSessionId();

    const { data, error } = await supabase
      .from('video_reactions')
      .select('reaction_type')
      .eq('video_id', videoId)
      .eq('user_session', sessionId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

    if (error) {
      console.error('Error fetching user reaction:', error);
      return null;
    }
    
    // Ensure we return null instead of undefined when no reaction exists
    if (!data) return null;
    return data.reaction_type as 'like' | 'dislike';
  } catch (error) {
    console.error('Error in getUserReaction:', error);
    return null;
  }
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

// Helper function to update video reaction counts - optimized with SQL aggregation
const updateVideoReactionCounts = async (videoId: string) => {
  try {
    // Use SQL aggregation instead of fetching all records and counting client-side
    const { data, error } = await supabase.rpc('update_video_reaction_counts', {
      video_id: videoId
    });

    if (error) {
      // Fallback to the old method if RPC function doesn't exist
      console.warn('RPC function not available, using fallback method');
      
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
    }
  } catch (error) {
    console.error('Error updating video reaction counts:', error);
  }
};

// Hook
export const useVideoReaction = (videoId: string) => {
  const queryClient = useQueryClient();

  const { data: userReaction, isLoading: reactionLoading } = useQuery({
    queryKey: ['video-reaction', videoId],
    queryFn: () => getUserReaction(videoId),
    enabled: !!videoId,
    staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 1, // Reduce retries for faster failure handling
    refetchOnWindowFocus: false, // Prevent excessive refetching
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
    onSuccess: (newReaction) => {
      // Update the video reaction cache directly
      queryClient.setQueryData(['video-reaction', videoId], newReaction);
      
      // Update the video cache to reflect new like/dislike counts without refetching
      queryClient.setQueryData(['video', videoId], (prevVideo: any) => {
        if (!prevVideo) return prevVideo;
        
        let likes = prevVideo.likes || 0;
        let dislikes = prevVideo.dislikes || 0;
        
        // Adjust counts based on previous and new reaction
        if (userReaction === 'like') {
          likes = Math.max(0, likes - 1); // Remove previous like
        } else if (userReaction === 'dislike') {
          dislikes = Math.max(0, dislikes - 1); // Remove previous dislike
        }
        
        if (newReaction === 'like') {
          likes += 1; // Add new like
        } else if (newReaction === 'dislike') {
          dislikes += 1; // Add new dislike
        }
        
        return {
          ...prevVideo,
          likes,
          dislikes
        };
      });
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