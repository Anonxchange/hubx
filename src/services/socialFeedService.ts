import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  creator_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  privacy: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  creator?: {
    id: string;
    username: string;
    full_name: string;
    profile_picture_url: string;
    user_type: string;
  };
  isLiked?: boolean;
}

export interface CreatePostData {
  content: string;
  media_url?: string;
  media_type?: string;
  privacy?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    full_name: string;
    profile_picture_url: string;
  };
}

// Create a new post
export const createPost = async (postData: CreatePostData): Promise<Post | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        creator_id: user.user.id,
        content: postData.content,
        media_url: postData.media_url,
        media_type: postData.media_type,
        privacy: postData.privacy || 'public'
      })
      .select(`
        *,
        creator:profiles!posts_creator_id_fkey(
          id,
          username,
          full_name,
          profile_picture_url,
          user_type
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

// Get posts for a specific creator
export const getCreatorPosts = async (creatorId: string): Promise<Post[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    const currentUserId = user.user?.id;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:profiles!posts_creator_id_fkey(
          id,
          username,
          full_name,
          profile_picture_url,
          user_type
        )
      `)
      .eq('creator_id', creatorId)
      .or(`privacy.eq.public${currentUserId === creatorId ? ',creator_id.eq.' + currentUserId : ''}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if current user liked each post
    if (currentUserId && data) {
      const postIds = data.map(post => post.id);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

      return data.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post.id)
      }));
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching creator posts:', error);
    return [];
  }
};

// Get feed posts for subscribed creators
export const getFeedPosts = async (limit: number = 20): Promise<Post[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    // Get subscribed creators
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('creator_id')
      .eq('subscriber_id', user.user.id);

    if (!subscriptions || subscriptions.length === 0) return [];

    const creatorIds = subscriptions.map(sub => sub.creator_id);

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:profiles!posts_creator_id_fkey(
          id,
          username,
          full_name,
          profile_picture_url,
          user_type
        )
      `)
      .in('creator_id', creatorIds)
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Check if current user liked each post
    if (data) {
      const postIds = data.map(post => post.id);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

      return data.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post.id)
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return [];
  }
};

// Subscribe to a creator
export const subscribeToCreator = async (creatorId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: user.user.id,
        creator_id: creatorId
      });

    return !error;
  } catch (error) {
    console.error('Error subscribing to creator:', error);
    return false;
  }
};

// Unsubscribe from a creator
export const unsubscribeFromCreator = async (creatorId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('subscriber_id', user.user.id)
      .eq('creator_id', creatorId);

    return !error;
  } catch (error) {
    console.error('Error unsubscribing from creator:', error);
    return false;
  }
};

// Check if user is subscribed to creator
export const isSubscribedToCreator = async (creatorId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', user.user.id)
      .eq('creator_id', creatorId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
};

// Get subscription count for a creator
export const getSubscriberCount = async (creatorId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .eq('creator_id', creatorId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting subscriber count:', error);
    return 0;
  }
};

// Like a post
export const likePost = async (postId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.user.id
      });

    return !error;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

// Unlike a post
export const unlikePost = async (postId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.user.id);

    return !error;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

// Add comment to post
export const addPostComment = async (postId: string, content: string): Promise<PostComment | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.user.id,
        content: content
      })
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(
          username,
          full_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Get comments for a post
export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(
          username,
          full_name,
          profile_picture_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    return !error;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};