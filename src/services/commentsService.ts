
import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  video_id: string;
  name: string;
  comment_text: string;
  created_at: string;
}

export interface CommentInsert {
  video_id: string;
  name: string;
  comment_text: string;
}

// Get comments for a video
export const getComments = async (videoId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data || [];
};

// Add a new comment
export const addComment = async (comment: CommentInsert) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
};
