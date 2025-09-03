
import { supabase } from '@/integrations/supabase/client';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  position: number;
  added_at: string;
}

export interface PlaylistWithVideoCount extends Playlist {
  video_count: number;
}

// Generate session ID for anonymous users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('user_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('user_session', sessionId);
  }
  return sessionId;
};

// Get all playlists for current user
export const getUserPlaylists = async (): Promise<PlaylistWithVideoCount[]> => {
  try {
    const sessionId = getSessionId();

    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_items(count)
      `)
      .eq('user_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlists (table may not exist):', error);
      return []; // Return empty array instead of throwing
    }

    return (data || []).map(playlist => ({
      ...playlist,
      video_count: playlist.playlist_items?.[0]?.count || 0
    }));
  } catch (error) {
    console.error('Playlists feature not available:', error);
    return []; // Return empty array for graceful fallback
  }
};

// Create a new playlist
export const createPlaylist = async (name: string, description?: string, isPublic = false): Promise<Playlist | null> => {
  try {
    const sessionId = getSessionId();

    const { data, error } = await supabase
      .from('playlists')
      .insert([
        {
          user_id: sessionId,
          name,
          description,
          is_public: isPublic
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating playlist (table may not exist):', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Playlists feature not available:', error);
    return null;
  }
};

// Add video to playlist
export const addVideoToPlaylist = async (playlistId: string, videoId: string): Promise<PlaylistItem | null> => {
  try {
    // Get the current highest position in the playlist
    const { data: lastItem } = await supabase
      .from('playlist_items')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (lastItem?.position || 0) + 1;

    const { data, error } = await supabase
      .from('playlist_items')
      .insert([
        {
          playlist_id: playlistId,
          video_id: videoId,
          position
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding video to playlist (table may not exist):', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Playlists feature not available:', error);
    return null;
  }
};

// Remove video from playlist
export const removeVideoFromPlaylist = async (playlistId: string, videoId: string): Promise<void> => {
  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId);

  if (error) {
    console.error('Error removing video from playlist:', error);
    throw error;
  }
};

// Check if video is in playlist
export const isVideoInPlaylist = async (playlistId: string, videoId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('playlist_items')
    .select('id')
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking if video is in playlist:', error);
    return false;
  }

  return !!data;
};

// Get playlist videos
export const getPlaylistVideos = async (playlistId: string) => {
  try {
    const { data, error } = await supabase
      .from('playlist_items')
      .select(`
        position,
        added_at,
        videos:video_id (
          id, title, description, video_url, thumbnail_url, duration, views, tags, created_at
        )
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching playlist videos (table may not exist):', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Playlists feature not available:', error);
    return [];
  }
};

// Delete playlist
export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};
