
import { supabase } from '@/integrations/supabase/client';
import { sanitizeUserInput } from '@/utils/sanitization';

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

// Add a new comment with sanitization
export const addComment = async (comment: CommentInsert) => {
  // Sanitize user input to prevent XSS
  const sanitizedComment = {
    ...comment,
    name: sanitizeUserInput(comment.name),
    comment_text: sanitizeUserInput(comment.comment_text)
  };

  // Validate input lengths
  if (sanitizedComment.name.length > 100) {
    throw new Error('Name must be 100 characters or less');
  }

  if (sanitizedComment.comment_text.length > 1000) {
    throw new Error('Comment must be 1000 characters or less');
  }

  if (!sanitizedComment.name.trim() || !sanitizedComment.comment_text.trim()) {
    throw new Error('Name and comment cannot be empty');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([sanitizedComment])
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
};
