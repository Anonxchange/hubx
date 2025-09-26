import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  getFeedPosts, 
  createPost, 
  likePost, 
  unlikePost, 
  addPostComment,
  getPostComments,
  Post 
} from '@/services/socialFeedService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon,
  Video,
  Upload,
  Globe,
  Lock,
  MoreHorizontal,
  Repeat2,
  Share,
  Home,
  Search,
  Bell,
  CreditCard,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VerificationBadge from '@/components/VerificationBadge';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { Link } from 'react-router-dom';
import ShareModal from '@/components/ShareModal';
import MessageButton from '@/components/MessageButton';


// Helper function to format post time in a perfect way
const formatPostTime = (dateString: string): string => {
  const postDate = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInMinutes < 1440) { // Less than 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h`;
  } else if (isToday(postDate)) {
    return format(postDate, 'HH:mm');
  } else if (isYesterday(postDate)) {
    return 'Yesterday';
  } else if (isThisWeek(postDate)) {
    return format(postDate, 'EEE'); // Mon, Tue, etc.
  } else if (isThisYear(postDate)) {
    return format(postDate, 'MMM d'); // Jan 15
  } else {
    return format(postDate, 'MMM d, yyyy'); // Jan 15, 2023
  }
};

const FeedPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('post');
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [newPostPrivacy, setNewPostPrivacy] = useState('public');
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{[key: string]: string}>({});
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [postComments, setPostComments] = useState<{[key: string]: any[]}>({});
  const [hasScrolledToTarget, setHasScrolledToTarget] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  

  // Check if user can post (only creators)
  const canPost = userProfile?.user_type === 'individual_creator' || userProfile?.user_type === 'studio_creator';

  useEffect(() => {
    if (user && !initialLoadComplete) {
      loadFeedPosts();
    }
  }, [user, initialLoadComplete]);

  // Reload feed when switching tabs
  useEffect(() => {
    if (user && initialLoadComplete) {
      setFeedLoading(true);
      loadFeedPosts();
    }
  }, [activeTab]);

  // Effect to handle scrolling to a specific post if targetPostId is present
  useEffect(() => {
    if (targetPostId && feedPosts.length > 0 && !hasScrolledToTarget && !feedLoading) {
      setTimeout(() => {
        const postElement = document.getElementById(`post-${targetPostId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Optionally, highlight the post
          postElement.classList.add('border-blue-500', 'border-2');
          setHasScrolledToTarget(true);
        }
      }, 100);
    }
  }, [targetPostId, feedPosts, hasScrolledToTarget, feedLoading]);

  const loadFeedPosts = async () => {
    if (!user) return;

    try {
      let allPosts = [];

      if (activeTab === 'following') {
        // Following tab: Only show posts from subscribed creators
        allPosts = await getFeedPosts(25);
      } else {
        // Home tab: Show all public posts from all users
        const { data: allPublicPosts, error } = await supabase
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
          .eq('privacy', 'public')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && allPublicPosts) {
          // Check if current user liked each post
          const postIds = allPublicPosts.map(post => post.id);
          const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user?.id || '')
            .in('post_id', postIds);

          const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

          allPosts = allPublicPosts.map(post => ({
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
      }

      // Update all states in a single batch to prevent flashing
      setFeedPosts(allPosts);
      setFeedLoading(false);
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostMedia) return;

    setIsPostingLoading(true);
    try {
      let mediaUrl = '';
      let mediaType = '';

      if (newPostMedia) {
        const fileName = `${Date.now()}-${newPostMedia.name}`;
        const { data, error } = await supabase.storage
          .from('post_media')
          .upload(fileName, newPostMedia);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('post_media')
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
        mediaType = newPostMedia.type.startsWith('video/') ? 'video' : 'image';
      }

      const post = await createPost({
        content: newPostContent,
        media_url: mediaUrl,
        media_type: mediaType,
        privacy: newPostPrivacy
      });

      if (post) {
        setFeedPosts([post, ...feedPosts]);
        setNewPostContent('');
        setNewPostMedia(null);
        setNewPostPrivacy('public');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPostingLoading(false);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      const success = isLiked ? await unlikePost(postId) : await likePost(postId);
      if (success) {
        setFeedPosts(feedPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !isLiked,
                likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return;

    try {
      const comment = await addPostComment(postId, commentText);
      if (comment) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [comment, ...(prev[postId] || [])]
        }));
        setCommentTexts(prev => ({ ...prev, [postId]: '' }));
        setFeedPosts(feedPosts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = async (postId: string) => {
    if (!showComments[postId] && !postComments[postId]) {
      const comments = await getPostComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Profile avatar */}
          <Link to={`/profile/${userProfile?.username}`} className="relative">
            <Avatar className="h-8 w-8 hover:ring-2 hover:ring-blue-500 transition-all">
              <AvatarImage 
                src={userProfile?.avatar_url || ''} 
                alt={userProfile?.username || 'User'} 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {(userProfile?.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Purple plus icon for subscription */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>

          {/* Center - HubX Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="gradient-overlay rounded-lg p-2">
              <span className="text-lg font-bold text-white">HubX</span>
            </div>
            <span className="text-sm text-gray-300 font-semibold">Community</span>
          </Link>

          {/* Right side - Video Icon */}
          <div className="flex items-center">
            <Link to="/moments">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-gray-800"
                data-testid="moments-video-button"
              >
                <Video className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 px-4 text-sm font-medium relative ${
              activeTab === 'home' 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            home
            {activeTab === 'home' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-4 text-sm font-medium relative ${
              activeTab === 'following' 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        {/* Create Post Section - Only for creators */}
        {canPost && activeTab === 'home' && (
          <div className="border-b border-gray-800 p-4">
            <div className="flex space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userProfile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {(userProfile?.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's happening?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[60px] bg-transparent border-none resize-none text-xl placeholder-gray-500 focus:ring-0"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setNewPostMedia(e.target.files?.[0] || null)}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload">
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-500/10 p-2" asChild>
                        <span className="cursor-pointer">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      </Button>
                    </label>

                    <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-500/10 p-2">
                      <Video className="h-5 w-5" />
                    </Button>

                    <Select value={newPostPrivacy} onValueChange={setNewPostPrivacy}>
                      <SelectTrigger className="w-auto border-none bg-transparent text-blue-500">
                        <Globe className="h-4 w-4 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Everyone can reply
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreatePost}
                    disabled={isPostingLoading || (!newPostContent.trim() && !newPostMedia)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-1.5 rounded-full disabled:opacity-50"
                  >
                    {isPostingLoading ? 'Posting...' : 'Post'}
                  </Button>
                </div>

                {newPostMedia && (
                  <div className="text-sm text-gray-400 bg-gray-900 rounded p-2">
                    📎 {newPostMedia.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feed Posts */}
        <div>
          {feedLoading ? (
            <div className="space-y-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-b border-gray-800 p-4 animate-pulse">
                  <div className="flex space-x-3">
                    <div className="h-12 w-12 bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      </div>
                      <div className="h-48 bg-gray-700 rounded-lg"></div>
                      <div className="flex space-x-8">
                        <div className="h-4 bg-gray-700 rounded w-8"></div>
                        <div className="h-4 bg-gray-700 rounded w-8"></div>
                        <div className="h-4 bg-gray-700 rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="text-center py-16 px-4">
                <div className="text-6xl mb-4">😴</div>
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === 'following' 
                    ? "Posts from creators you follow will show up here. Follow some creators to see their content!"
                    : "All public posts from creators will show up here. Check back soon for new content!"
                  }
                </p>
              </div>
          ) : (
            feedPosts.map((post) => (
              <article key={post.id} className="border-b border-gray-800 p-4 hover:bg-gray-950/50 transition-colors" id={`post-${post.id}`}>
                <div className="flex space-x-3">
                  <Link to={`/profile/${post.creator?.username}`} className="flex-shrink-0 relative">
                    <Avatar className="h-12 w-12 hover:ring-2 hover:ring-blue-500 transition-all">
                      <AvatarImage 
                        src={post.creator?.profile_picture_url || ''} 
                        alt={post.creator?.username || 'Creator'} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {(post.creator?.username || 'A')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Purple plus icon for subscription */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Link to={`/profile/${post.creator?.username}`} className="flex items-center space-x-2 hover:underline min-w-0">
                          <span className="font-bold text-white text-[15px] truncate">
                            @{post.creator?.username || 'anonymous'}
                          </span>
                          {(post.creator?.user_type === 'individual_creator' || post.creator?.user_type === 'studio_creator') && (
                            <VerificationBadge
                              userType={post.creator.user_type as 'individual_creator' | 'studio_creator'}
                              showText={false}
                            />
                          )}
                        </Link>
                        <span className="text-gray-500 text-sm flex-shrink-0">
                          · {formatPostTime(post.created_at)}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-800 hover:text-white p-1 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mb-3">
                      <p className="text-white text-[15px] leading-5">{post.content}</p>

                      {post.media_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                          {post.media_type?.startsWith('image') ? (
                            <img 
                              src={post.media_url} 
                              alt="Post media"
                              className="w-full h-auto max-h-96 object-cover"
                            />
                          ) : post.media_type?.startsWith('video') ? (
                            <video 
                              src={post.media_url}
                              controls
                              className="w-full h-auto max-h-96 object-cover"
                            />
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between max-w-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 p-2 rounded-full group"
                      >
                        <MessageCircle className="h-[18px] w-[18px] mr-1" />
                        <span className="text-sm">{post.comments_count || ''}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-green-500 hover:bg-green-500/10 p-2 rounded-full group"
                      >
                        <Repeat2 className="h-[18px] w-[18px] mr-1" />
                        <span className="text-sm">7</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikePost(post.id, post.isLiked || false)}
                        className={`hover:bg-red-500/10 p-2 rounded-full group ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-[18px] w-[18px] mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.likes_count || ''}</span>
                      </Button>

                      <ShareModal
                        postId={post.id}
                        postTitle={post.content?.substring(0, 50) + '...' || 'Social Post'}
                        isPost={true}
                      >
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 p-2 rounded-full group">
                          <Share className="h-[18px] w-[18px]" />
                        </Button>
                      </ShareModal>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="mt-4 border-t border-gray-800 pt-4">
                        {/* Add Comment Input */}
                        {user && (
                          <div className="flex space-x-3 mb-4">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userProfile?.avatar_url || ''} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                {(userProfile?.username || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex items-center space-x-2">
                              <Textarea
                                placeholder="Post your reply"
                                value={commentTexts[post.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="bg-transparent border border-gray-700 text-white text-sm min-h-[40px] resize-none rounded-full px-4 py-2"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleCommentSubmit(post.id)}
                                disabled={!commentTexts[post.id]?.trim()}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4"
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4">
                          {(postComments[post.id] || []).map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.user?.avatar_url || ''} />
                                <AvatarFallback className="bg-gray-600 text-white text-sm">
                                  {(comment.user?.username || 'U')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="font-bold text-white text-sm">
                                    {comment.user?.full_name || comment.user?.username || 'Anonymous'}
                                  </span>
                                  <span className="text-gray-500 text-sm">@{comment.user?.username}</span>
                                  <span className="text-gray-500">·</span>
                                  <span className="text-gray-500 text-sm">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}
                                  </span>
                                </div>
                                <p className="text-white text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="flex items-center justify-around py-2 max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-white hover:bg-gray-800 py-3"
            data-testid="nav-home"
          >
            <div className="flex flex-col items-center space-y-1">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </div>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-500 hover:bg-gray-800 hover:text-white py-3"
            data-testid="nav-search"
          >
            <div className="flex flex-col items-center space-y-1">
              <Search className="w-5 h-5" />
              <span className="text-xs">Search</span>
            </div>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-500 hover:bg-gray-800 hover:text-white py-3"
            data-testid="nav-music"
          >
            <div className="flex flex-col items-center space-y-1">
              <Bell className="w-5 h-5" />
              <span className="text-xs">Notifications</span>
            </div>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-500 hover:bg-gray-800 hover:text-white py-3"
            data-testid="nav-premium"
          >
            <div className="flex flex-col items-center space-y-1">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Premium</span>
            </div>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-500 hover:bg-gray-800 hover:text-white py-3"
            data-testid="nav-messages"
          >
            <div className="flex flex-col items-center space-y-1">
              <Mail className="w-5 h-5" />
              <span className="text-xs">Messages</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Floating Post Button - Only for creators and only in home tab */}
      {canPost && activeTab === 'home' && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => {
              // Scroll to top where create post is (near HubX logo)
              window.scrollTo({ top: 0, behavior: 'smooth' });
              // Focus on post textarea after scroll
              setTimeout(() => {
                const textarea = document.querySelector('textarea[placeholder="What\'s happening?"]') as HTMLTextAreaElement;
                if (textarea) {
                  textarea.focus();
                }
              }, 500);
            }}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            data-testid="floating-post-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      )}

      
    </div>
  );
};

export default FeedPage;