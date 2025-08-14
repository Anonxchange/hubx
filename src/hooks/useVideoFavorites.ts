
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generate or get anonymous session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

// Check if video is favorited
export const getVideoFavoriteStatus = async (videoId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  const { data, error } = await supabase
    .from('video_favorites')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_session', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking favorite status:', error);
    return false;
  }
  
  return !!data;
};

// Add video to favorites
export const addToFavorites = async (videoId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  const { error } = await supabase
    .from('video_favorites')
    .insert({
      video_id: videoId,
      user_session: sessionId
    });

  if (error) throw error;
};

// Remove video from favorites
export const removeFromFavorites = async (videoId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = user?.id || getSessionId();

  const { error } = await supabase
    .from('video_favorites')
    .delete()
    .eq('video_id', videoId)
    .eq('user_session', sessionId);

  if (error) throw error;
};

// Hook for managing favorites
export const useVideoFavorites = (videoId: string) => {
  const queryClient = useQueryClient();

  const { data: isFavorited, isLoading } = useQuery({
    queryKey: ['video-favorite', videoId],
    queryFn: () => getVideoFavoriteStatus(videoId),
    enabled: !!videoId,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      if (isFavorited) {
        await removeFromFavorites(videoId);
        toast.success('Removed from favorites');
        return false;
      } else {
        await addToFavorites(videoId);
        toast.success('Added to favorites');
        return true;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-favorite', videoId] });
    },
    onError: (error) => {
      console.error('Favorite mutation error:', error);
      toast.error('Failed to update favorites');
    },
  });

  return {
    isFavorited: !!isFavorited,
    toggleFavorite: () => favoriteMutation.mutate(videoId),
    isLoading: isLoading || favoriteMutation.isPending,
  };
};
