
import React, { useState, useEffect } from 'react';
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
  Lock
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const FeedPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [newPostPrivacy, setNewPostPrivacy] = useState('public');
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);

  // Check if user can post (only creators)
  const canPost = userProfile?.user_type === 'individual_creator' || userProfile?.user_type === 'studio_creator';

  useEffect(() => {
    if (user) {
      loadFeedPosts();
    }
  }, [user]);

  const loadFeedPosts = async () => {
    setFeedLoading(true);
    try {
      const posts = await getFeedPosts(50);
      setFeedPosts(posts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setFeedLoading(false);
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
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Feed</h1>

        {/* Create Post Section - Only for creators */}
        {canPost && (
          <Card className="mb-8 bg-gray-800 border-gray-700">
            <CardHeader>
              <h2 className="text-xl font-semibold">Create a Post</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px] bg-gray-700 border-gray-600"
              />
              
              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setNewPostMedia(e.target.files?.[0] || null)}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Add Media
                    </span>
                  </Button>
                </label>

                <Select value={newPostPrivacy} onValueChange={setNewPostPrivacy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public
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

              {newPostMedia && (
                <div className="text-sm text-gray-400">
                  Selected: {newPostMedia.name}
                </div>
              )}

              <Button 
                onClick={handleCreatePost}
                disabled={isPostingLoading || (!newPostContent.trim() && !newPostMedia)}
                className="w-full"
              >
                {isPostingLoading ? 'Posting...' : 'Post'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Feed Posts */}
        <div className="space-y-6">
          {feedLoading ? (
            <div className="text-center text-gray-400">Loading feed...</div>
          ) : feedPosts.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-8">
                <p className="text-gray-400">No posts to show yet!</p>
                <p className="text-sm text-gray-500 mt-2">
                  Subscribe to creators to see their posts here.
                </p>
              </CardContent>
            </Card>
          ) : (
            feedPosts.map((post) => (
              <Card key={post.id} className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={post.creator?.profile_picture_url} />
                      <AvatarFallback>
                        {post.creator?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {post.creator?.full_name || post.creator?.username}
                        </h3>
                        <span className="text-sm text-gray-500">
                          @{post.creator?.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {post.creator?.user_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="mb-3">{post.content}</p>
                    
                    {post.media_url && (
                      <div className="rounded-lg overflow-hidden">
                        {post.media_type === 'video' ? (
                          <video
                            src={post.media_url}
                            controls
                            className="w-full max-h-96 object-cover"
                          />
                        ) : (
                          <img
                            src={post.media_url}
                            alt="Post media"
                            className="w-full max-h-96 object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <button
                      onClick={() => handleLikePost(post.id, post.isLiked || false)}
                      className={`flex items-center gap-2 hover:text-red-400 transition-colors ${
                        post.isLiked ? 'text-red-400' : ''
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      {post.likes_count}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments_count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeedPage;
