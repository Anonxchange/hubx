import { supabase } from '@/integrations/supabase/client';
import { uploadPostMedia } from './bunnyStorageService';


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
  media_file?: File; // Added for file uploads
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
    if (!user.user) return null;

    let mediaUrl = postData.media_url || '';
    let mediaType = postData.media_type || '';

    // Upload media to Bunny CDN if file is provided
    if (postData.media_file) {
      const uploadResult = await uploadPostMedia(postData.media_file, user.user.id);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('Failed to upload media to storage');
      }

      mediaUrl = uploadResult.url;
      mediaType = postData.media_file.type.startsWith('image/') ? 'image' :
                 postData.media_file.type.startsWith('video/') ? 'video' : '';
    }

    // Insert the post directly
    const { data: insertedPost, error: postError } = await supabase
      .from('posts')
      .insert([{
        creator_id: user.user.id,
        content: postData.content,
        media_url: mediaUrl,
        media_type: mediaType,
        privacy: postData.privacy || 'public'
      }])
      .select('*')
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      throw postError;
    }

    // Fetch the creator profile separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, user_type')
      .eq('id', user.user.id)
      .single();

    return {
      ...insertedPost,
      creator: {
        ...profileData,
        profile_picture_url: profileData?.avatar_url
      },
      isLiked: false,
      likes_count: 0,
      comments_count: 0
    };
  } catch (error) {
    console.error('Error creating post:', error);
    // Return null for graceful degradation
    if (error instanceof Error && error.message.includes('Could not find a relationship')) {
      console.warn('Social feed feature not available - database schema incomplete');
      return null;
    }
    return null;
  }
};

// Get posts for a specific creator
export const getCreatorPosts = async (creatorId: string): Promise<Post[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    const currentUserId = user.user?.id;

    // Try to fetch posts with profile data, handle potential FK relationship issues
    let data, error;
    try {
      const result = await supabase
        .from('posts')
        .select(`
          *,
          creator:profiles!posts_creator_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            user_type
          ),
          post_likes(user_id),
          post_comments(id)
        `)
        .eq('creator_id', creatorId)
        .or(`privacy.eq.public${currentUserId === creatorId ? ',creator_id.eq.' + currentUserId : ''}`)
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    } catch (relationError) {
      // Fallback: fetch posts without the relationship if FK constraint is missing
      console.log('Foreign key relationship not found, fetching posts without profile join');
      const fallbackResult = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', creatorId)
        .or(`privacy.eq.public${currentUserId === creatorId ? ',creator_id.eq.' + currentUserId : ''}`)
        .order('created_at', { ascending: false });
      data = fallbackResult.data;
      error = fallbackResult.error;

      // Add creator info manually if we have posts
      if (data && data.length > 0) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, user_type')
            .eq('id', creatorId)
            .single();

          if (profileData) {
            data = data.map(post => ({
              ...post,
              creator: profileData
            }));
          }
        } catch (profileError) {
          console.error('Error fetching profile for posts:', profileError);
        }
      }
    }

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
        isLiked: likedPostIds.has(post.id),
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        creator: {
          ...post.creator,
          profile_picture_url: post.creator?.avatar_url
        }
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

    // Try to fetch posts with profile data, handle potential FK relationship issues
    let data, error;
    try {
      const result = await supabase
        .from('posts')
        .select(`
          *,
          creator:profiles!posts_creator_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            user_type
          ),
          post_likes!left(user_id),
          post_comments!left(id)
        `)
        .in('creator_id', creatorIds)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);
      data = result.data;
      error = result.error;
    } catch (relationError) {
      // Fallback: fetch posts without the relationship if FK constraint is missing
      console.log('Foreign key relationship not found, fetching posts without profile join');
      const fallbackResult = await supabase
        .from('posts')
        .select('*')
        .in('creator_id', creatorIds)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);
      data = fallbackResult.data;
      error = fallbackResult.error;

      // Add creator info manually if we have posts
      if (data && data.length > 0) {
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, user_type')
            .in('id', creatorIds);

          if (profilesData && profilesData.length > 0) {
            const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));
            data = data.map(post => ({
              ...post,
              creator: profilesMap.get(post.creator_id) || null
            }));
          }
        } catch (profileError) {
          console.error('Error fetching profiles for posts:', profileError);
        }
      }
    }

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
        isLiked: post.post_likes.some((like: any) => like.user_id === user.user.id),
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        creator: {
          ...post.creator,
          profile_picture_url: post.creator?.avatar_url
        }
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
    console.error('Error checking subscription status:', error);
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

    // First insert the comment
    const { data: commentData, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.user.id,
        content: content
      })
      .select('*')
      .single();

    if (commentError) throw commentError;

    // Then get the user profile data separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', user.user.id)
      .single();

    // Combine the data
    const comment: PostComment = {
      ...commentData,
      user: {
        username: profileData?.username || '',
        full_name: profileData?.full_name || '',
        profile_picture_url: profileData?.avatar_url || ''
      }
    };

    return comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Get comments for a post
export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  try {
    // First try with the relationship, then fallback if it fails
    let data, error;
    try {
      const result = await supabase
        .from('post_comments')
        .select(`
          *,
          user:profiles!post_comments_user_id_fkey(
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      data = result.data;
      error = result.error;
    } catch (relationError) {
      // Fallback: fetch comments and profiles separately
      console.log('Foreign key relationship not found, fetching comments with manual profile join');
      const commentsResult = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (commentsResult.error) throw commentsResult.error;
      data = commentsResult.data;

      // Get user profiles for each comment
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        if (profilesData) {
          const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));
          data = data.map(comment => ({
            ...comment,
            user: profilesMap.get(comment.user_id) || null
          }));
        }
      }
    }

    if (error) throw error;

    // Ensure the correct field mapping for profile_picture_url
    return (data || []).map(comment => ({
      ...comment,
      user: comment.user ? {
        ...comment.user,
        profile_picture_url: comment.user.avatar_url || comment.user.profile_picture_url || ''
      } : null
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Edit a post
export const editPost = async (postId: string, content: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ 
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) {
      console.error('Error editing post:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error editing post:', error);
    return false;
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};