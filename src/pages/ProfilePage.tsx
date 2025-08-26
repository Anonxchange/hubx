import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getUserFavorites, getUserWatchHistory, UserStats } from '@/services/userStatsService';
import {
  createPost,
  getCreatorPosts,
  getFeedPosts,
  subscribeToCreator,
  unsubscribeFromCreator,
  isSubscribedToCreator,
  getSubscriberCount,
  likePost,
  unlikePost,
  addPostComment,
  getPostComments,
  deletePost,
  editPost,
  Post
} from '@/services/socialFeedService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Camera,
  Edit3,
  Settings,
  Crown,
  Video,
  Users,
  Heart,
  Eye,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Upload,
  Star,
  DollarSign,
  Play,
  Send,
  MessageCircle,
  ThumbsUp,
  ImageIcon,
  X,
  UserPlus,
  UserMinus
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VerificationBadge from '@/components/VerificationBadge';
import UploadPage from '@/pages/UploadPage';
import AdComponent from '@/components/AdComponent';
import { supabase } from '@/integrations/supabase/client';
import { uploadProfilePicture, uploadCoverPhoto, extractPathFromUrl, deleteFromBunnyStorage, uploadPostMedia } from '@/services/bunnyStorageService';
import MessageButton from '@/components/MessageButton'; // Assuming MessageButton is in this path
import ShareModal from '@/components/ShareModal';
import { formatDistanceToNow } from 'date-fns';

const ProfilePage = () => {
  const { user, userType, loading } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const [profileLoadComplete, setProfileLoadComplete] = useState(false);
  const [profileUserType, setProfileUserType] = useState<string>('user'); // For viewing other users' profiles

  // Determine if this is own profile after we know the current user's username
  const isOwnProfile = !username || (currentUserUsername && username === currentUserUsername);
  const [isEditing, setIsEditing] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [bio, setBio] = useState('Welcome to my profile! 🌟');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [joinDate] = useState(new Date().toLocaleDateString());
  const [stats, setStats] = useState<UserStats>({
    videosWatched: 0,
    subscribers: 0,
    totalViews: 0,
    favoritesCount: 0,
    uploadedVideos: 0,
    earnings: 0,
    watchTimeMinutes: 0
  });
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipDetails, setTipDetails] = useState({
    paypal: '',
    venmo: '',
    cashapp: '',
    bitcoin: '',
    ethereum: '',
    description: 'Support my content creation journey! 💖'
  });
  const [showMoreFavorites, setShowMoreFavorites] = useState(false);

  // Social Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [newPostMediaPreview, setNewPostMediaPreview] = useState<string>('');
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null); // State to store fetched profile data
  const [initialSocialLoadComplete, setInitialSocialLoadComplete] = useState(false);

  // First useEffect to get current user's username
  useEffect(() => {
    const fetchCurrentUserUsername = async () => {
      if (user?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

          setCurrentUserUsername(data?.username || null);
          setProfileLoadComplete(true);
        } catch (error) {
          console.error('Error fetching current user username:', error);
          setCurrentUserUsername(null);
          setProfileLoadComplete(true);
        }
      } else {
        setProfileLoadComplete(true);
      }
    };

    fetchCurrentUserUsername();
  }, [user?.id]);

  // Second useEffect to fetch profile data after we know usernames
  useEffect(() => {
    if (!profileLoadComplete) return;

    const fetchUserData = async () => {
      let targetUserId = user?.id;
      let fetchedProfileData: any = null;

      // If viewing someone else's profile by username (or guest viewing any profile)
      if (username && (currentUserUsername !== username || !currentUserUsername)) {
        try {
          // Query with basic columns that should exist
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, user_type, avatar_url')
            .eq('username', username)
            .single();

          // Try to get additional columns if they exist
          let additionalData = {};
          try {
            const { data: fullData } = await supabase
              .from('profiles')
              .select('bio, location, website, cover_photo_url, tip_paypal, tip_venmo, tip_cashapp, tip_bitcoin, tip_ethereum, tip_description')
              .eq('username', username)
              .single();
            if (fullData) {
              additionalData = fullData;
            }
          } catch (e) {
            console.log('Additional profile columns not available yet');
          }

          if (error || !data) {
            console.error('Profile not found for username:', username, error);
            setStatsLoading(false);
            return;
          }

          targetUserId = data.id;
          fetchedProfileData = { ...data, ...additionalData }; // Store the fetched data

          // Set public profile data for display with available columns
          setDisplayName(data.full_name || data.username || username);
          setBio(additionalData.bio || 'Welcome to my profile! 🌟');
          setLocation(additionalData.location || '');
          setWebsite(additionalData.website || '');
          setProfilePhoto(data.avatar_url || '');
          setCoverPhoto(additionalData.cover_photo_url || '');

          // Set tip details if available
          if (additionalData) {
            setTipDetails({
              paypal: additionalData.tip_paypal || '',
              venmo: additionalData.tip_venmo || '',
              cashapp: additionalData.tip_cashapp || '',
              bitcoin: additionalData.tip_bitcoin || '',
              ethereum: additionalData.tip_ethereum || '',
              description: additionalData.tip_description || 'Support my content creation journey! 💖'
            });
          }

          // Set profile user type for proper display
          if (data.user_type) {
            setProfileUserType(data.user_type);
          }
        } catch (error) {
          console.error('Error fetching public profile:', error);
          setStatsLoading(false);
          return;
        }
      }

      // Fetch detailed stats and tip details only if we have a target user ID
      if (targetUserId) {
        setStatsLoading(true);
        try {
          const profilePromise = supabase
            .from('profiles')
            .select('id, username, full_name, user_type, avatar_url, bio, location, website, cover_photo_url, tip_paypal, tip_venmo, tip_cashapp, tip_bitcoin, tip_ethereum, tip_description')
            .eq('id', targetUserId)
            .maybeSingle();

          const promises = [
            getUserStats(targetUserId),
            getUserFavorites(targetUserId),
            getUserWatchHistory(targetUserId),
            profilePromise
          ];

          const targetUserType = fetchedProfileData?.user_type || userType;
          if (targetUserType === 'individual_creator' || targetUserType === 'studio_creator') {
            promises.push(
              supabase
                .from('videos')
                .select('*')
                .eq('owner_id', targetUserId)
                .order('created_at', { ascending: false })
            );
          }

          const results = await Promise.all(promises);
          const [userStats, userFavorites, userWatchHistory, profileResponse, ...rest] = results;
          const uploadsResponse = rest[0];

          if (typeof userStats === 'object' && 'videosWatched' in userStats) {
            setStats(userStats);
          }
          if (Array.isArray(userFavorites)) {
            setFavorites(userFavorites);
          }
          if (Array.isArray(userWatchHistory)) {
            setWatchHistory(userWatchHistory);
          }

          if (profileResponse && profileResponse.data) {
            const profile = profileResponse.data;
            setProfileData(profile); // Store the full profile data

            // Set profile fields if they weren't already set from public fetch
            if (!displayName) setDisplayName(profile.full_name || profile.username || '');
            if (!bio) setBio(profile.bio || 'Welcome to my profile! 🌟');
            if (!location) setLocation(profile.location || '');
            if (!website) setWebsite(profile.website || '');
            if (!profilePhoto) setProfilePhoto(profile.avatar_url || '');
            if (!coverPhoto) setCoverPhoto(profile.cover_photo_url || '');

            if (profile.user_type) {
              setProfileUserType(profile.user_type);
            }

            if (!tipDetails.paypal && !tipDetails.venmo && !tipDetails.cashapp && !tipDetails.bitcoin && !tipDetails.ethereum) {
              setTipDetails({
                paypal: profile.tip_paypal || '',
                venmo: profile.tip_venmo || '',
                cashapp: profile.tip_cashapp || '',
                bitcoin: profile.tip_bitcoin || '',
                ethereum: profile.tip_ethereum || '',
                description: profile.tip_description || 'Support my content creation journey! 💖'
              });
            }
          }

          if (uploadsResponse && Array.isArray(uploadsResponse.data)) {
            setUploadedVideos(uploadsResponse.data || []);
          } else if (uploadsResponse && uploadsResponse.error) {
            console.error('Error fetching uploaded videos:', uploadsResponse.error);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setStatsLoading(false);
        }
      } else {
        setStatsLoading(false);
      }
    };

    const fetchSocialData = async () => {
      if (initialSocialLoadComplete) return;

      let targetUserId = user?.id;

      if (username && (currentUserUsername !== username || !currentUserUsername)) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio, user_type')
            .eq('username', username)
            .single();

          if (data) {
            targetUserId = data.id;
            setDisplayName(data.full_name || data.username || username);
            setProfilePhoto(data.avatar_url || '');
            setBio(data.bio || 'Welcome to my profile! 🌟');
            setProfileUserType(data.user_type || 'user');
          } else {
            console.log('Profile not found for username:', username);
            targetUserId = null;
          }
        } catch (error) {
          console.error('Error fetching user ID for posts:', error);
          setPostsLoading(false);
          setFeedLoading(false);
          setInitialSocialLoadComplete(true);
          return;
        }
      }

      // Batch all async operations to prevent multiple state updates
      const promises = [];

      if (targetUserId) {
        promises.push(getCreatorPosts(targetUserId));
        promises.push(getSubscriberCount(targetUserId));
        if (targetUserId !== user?.id && user?.id) {
          promises.push(isSubscribedToCreator(targetUserId));
        }
      }

      if (user?.id && (!username || (currentUserUsername && username === currentUserUsername))) {
        // For own profile, fetch both feed posts and additional public posts
        promises.push(getFeedPosts(50));
        promises.push(
          supabase
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
            .limit(25)
        );
      }

      try {
        const results = await Promise.all(promises);
        let resultIndex = 0;

        if (targetUserId) {
          setPosts(results[resultIndex++] || []);
          setSubscriberCount(results[resultIndex++] || 0);
          if (targetUserId !== user?.id && user?.id) {
            setIsSubscribed(results[resultIndex++] || false);
          }
        }

        if (user?.id && (!username || (currentUserUsername && username === currentUserUsername))) {
          const subscribedPosts = results[resultIndex++] || [];
          const publicPostsResult = results[resultIndex++];

          let allPosts = subscribedPosts;

          // Process public posts if available
          if (publicPostsResult && !publicPostsResult.error && publicPostsResult.data) {
            const publicPosts = publicPostsResult.data;

            // Check if current user liked each post
            const postIds = publicPosts.map(post => post.id);
            const { data: likes } = await supabase
              .from('post_likes')
              .select('post_id')
              .eq('user_id', user?.id || '')
              .in('post_id', postIds);

            const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

            const formattedPublicPosts = publicPosts.map(post => ({
              ...post,
              isLiked: likedPostIds.has(post.id),
              likes_count: post.post_likes?.length || 0,
              comments_count: post.post_comments?.length || 0,
              creator: {
                ...post.creator,
                profile_picture_url: post.creator?.avatar_url
              }
            }));

            // Combine and deduplicate posts
            const combinedPosts = [...subscribedPosts, ...formattedPublicPosts];
            allPosts = combinedPosts.filter((post, index, self) => 
              index === self.findIndex(p => p.id === post.id)
            ).sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          }

          setFeedPosts(allPosts);
        }
      } catch (error) {
        console.error('Error fetching social data:', error);
      }

      // Update all loading states together to prevent flashing
      setPostsLoading(false);
      setFeedLoading(false);
      setInitialSocialLoadComplete(true);
    };

    fetchUserData();
    fetchSocialData();
  }, [user?.id, userType, username, currentUserUsername, profileLoadComplete]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!username && !user) return <Navigate to="/auth" replace />;

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      try {
        if (coverPhoto) {
          const oldPath = extractPathFromUrl(coverPhoto);
          if (oldPath) {
            await deleteFromBunnyStorage(oldPath);
          }
        }
        const uploadResult = await uploadCoverPhoto(file, user.id);
        if (uploadResult.success && uploadResult.url) {
          setCoverPhoto(uploadResult.url);
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: currentUserUsername || user.email?.split('@')[0] || 'user',
              full_name: displayName || user.email?.split('@')[0] || 'User',
              cover_photo_url: uploadResult.url,
              user_type: userType || 'user',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Error saving cover photo to database:', error);
            alert('Cover photo uploaded but failed to save. Please try again.');
          } else {
            console.log('Cover photo saved successfully');
            alert('Cover photo updated successfully!');
          }
        } else {
          console.error('Failed to upload cover photo:', uploadResult.error);
          alert('Failed to upload cover photo. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading cover photo:', error);
        alert('Error uploading cover photo. Please try again.');
      }
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      try {
        if (profilePhoto) {
          const oldPath = extractPathFromUrl(profilePhoto);
          if (oldPath) {
            await deleteFromBunnyStorage(oldPath);
          }
        }
        const uploadResult = await uploadProfilePicture(file, user.id);
        if (uploadResult.success && uploadResult.url) {
          setProfilePhoto(uploadResult.url);
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: currentUserUsername || user.email?.split('@')[0] || 'user',
              full_name: displayName || user.email?.split('@')[0] || 'User',
              avatar_url: uploadResult.url,
              user_type: userType || 'user',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Error saving profile photo to database:', error);
            alert('Profile photo uploaded but failed to save. Please try again.');
          } else {
            console.log('Profile photo saved successfully');
            alert('Profile photo updated successfully!');
          }
        } else {
          console.error('Failed to upload profile photo:', uploadResult.error);
          alert('Failed to upload profile photo. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        alert('Error uploading profile photo. Please try again.');
      }
    }
  };

  const getUserTypeInfo = () => {
    const displayUserType = isOwnProfile ? userType : profileUserType;

    switch (displayUserType) {
      case 'individual_creator':
        return { icon: Video, label: 'Individual Creator', color: 'text-orange-500', bgColor: 'bg-orange-500/10' };
      case 'studio_creator':
        return { icon: Crown, label: 'Studio Creator', color: 'text-purple-500', bgColor: 'bg-purple-500/10' };
      default:
        return { icon: Users, label: 'User', color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const TypeIcon = userTypeInfo.icon;
  const currentUsername = currentUserUsername || user?.email?.split('@')[0] || 'User';
  const displayedName = displayName || currentUsername;

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostMedia) return;

    setIsPostingLoading(true);
    try {
      let mediaUrl = '';
      let mediaType = '';

      if (newPostMedia && user?.id) {
        const uploadResult = await uploadPostMedia(newPostMedia, user.id);
        if (!uploadResult.success || !uploadResult.url) {
          console.error('Error uploading media:', uploadResult.error);
          throw new Error('Failed to upload media');
        }
        mediaUrl = uploadResult.url;
        mediaType = newPostMedia.type.startsWith('image/') ? 'image' :
                   newPostMedia.type.startsWith('video/') ? 'video' : '';
      }

      const newPost = await createPost({
        content: newPostContent,
        media_url: mediaUrl,
        media_type: mediaType
      });

      if (newPost) {
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setNewPostMedia(null);
        setNewPostMediaPreview('');
        setIsCreatePostModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPostingLoading(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostMedia(file);
      const reader = new FileReader();
      reader.onload = (e) => setNewPostMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    const success = isLiked ? await unlikePost(postId) : await likePost(postId);
    if (success) {
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, isLiked: !isLiked, likes_count: post.likes_count + (isLiked ? -1 : 1) }
          : post
      ));
      setFeedPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, isLiked: !isLiked, likes_count: post.likes_count + (isLiked ? -1 : 1) }
          : post
      ));
    }
  };

  const handleSubscribe = async () => {
    if (!username || isOwnProfile || !user?.id) return;

    let targetUserId = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      if (data) {
        targetUserId = data.id;
      }
    } catch (error) {
      console.error('Error getting target user ID for subscribe:', error);
      return;
    }

    if (!targetUserId) return;

    const success = isSubscribed
      ? await unsubscribeFromCreator(targetUserId)
      : await subscribeToCreator(targetUserId);

    if (success) {
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(prev => prev + (isSubscribed ? -1 : 1));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      const success = await deletePost(postId);
      if (success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
      }
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const PostCard: React.FC<{ post: Post; showDelete?: boolean }> = ({ post, showDelete = false }) => {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');

    const toggleComments = async () => {
      if (!showComments && comments.length === 0) {
        const postComments = await getPostComments(post.id);
        setComments(postComments);
      }
      setShowComments(!showComments);
    };

    const handleCommentSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!commentText.trim()) return;

      try {
        const comment = await addPostComment(post.id, commentText);
        if (comment) {
          setComments([...comments, comment]);
          setCommentText('');
          // Update post comments count
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p
          ));
          setFeedPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p
          ));
        }
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    };

    const handleEditPost = async () => {
      if (!editContent.trim()) return;

      try {
        const success = await editPost(post.id, editContent);
        if (success) {
          // Update the post content in the state
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, content: editContent } : p
          ));
          setIsEditing(false);
          alert('Post updated successfully!');
        } else {
          alert('Failed to update post. Please try again.');
        }
      } catch (error) {
        console.error('Error editing post:', error);
        alert('Error updating post. Please try again.');
      }
    };

    return (
      <Card className="bg-gray-900 border-gray-800 mb-4 w-full max-w-full">
        <CardContent className="p-4 max-w-full overflow-hidden">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.creator?.profile_picture_url} />
              <AvatarFallback className="bg-orange-500 text-white">
                {post.creator?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{post.creator?.full_name || post.creator?.username}</span>
                  {(post.creator?.user_type === 'individual_creator' || post.creator?.user_type === 'studio_creator') && (
                    <VerificationBadge userType={post.creator.user_type} showText={false} />
                  )}
                  <span className="text-gray-400 text-sm">@{post.creator?.username}</span>
                  <span className="text-gray-400 text-sm">·</span>
                  <span className="text-gray-400 text-sm">{formatPostDate(post.created_at)}</span>
                </div>
                {showDelete && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 p-1 h-6 w-6"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="mb-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white mb-2"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={handleEditPost}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(post.content || '');
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-white mb-3 break-words">{post.content}</p>
              )}
              {post.media_url && (
                <div className="mb-3 rounded-lg overflow-hidden max-w-full">
                  {post.media_type === 'image' ? (
                    <img src={post.media_url} alt="Post media" className="w-full max-h-96 object-cover rounded-lg" />
                  ) : post.media_type === 'video' ? (
                    <video src={post.media_url} controls className="w-full max-h-96 rounded-lg" />
                  ) : null}
                </div>
              )}
              <div className="flex items-center space-x-6 text-gray-400">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-1 hover:text-red-400 ${post.isLiked ? 'text-red-400' : ''}`}
                  onClick={() => handleLikePost(post.id, post.isLiked || false)}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likes_count}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 hover:text-blue-400"
                  onClick={toggleComments}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count}</span>
                </Button>
                <ShareModal
                  postId={post.id}
                  postTitle={post.content?.substring(0, 50) + '...' || 'Social Post'}
                  isPost={true}
                >
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-green-400">
                    <Send className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                </ShareModal>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  {/* Add Comment Input */}
                  {user ? (
                    <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profilePhoto || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {(currentUserUsername || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit(e);
                            }
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-sm min-h-[60px] resize-none"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!commentText.trim()}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-gray-700 rounded-lg p-4 text-center mb-4">
                      <p className="text-gray-300 text-sm mb-3">You need to be logged in to comment</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/auth')}
                        className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      >
                        Sign In to Comment
                      </Button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={comment.user?.avatar_url || ''} />
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {(comment.user?.username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-700 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                {comment.user?.full_name || comment.user?.username || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-200">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full bg-gray-900 py-2 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <AdComponent zoneId="5660534" className="w-full" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative">
          <div className="relative -mt-2">
            <div
              className="w-full h-32 sm:h-36 md:h-40 bg-gradient-to-br from-gray-800 via-gray-700 to-black relative overflow-hidden"
              style={{
                backgroundImage: coverPhoto ? `url(${coverPhoto})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {isOwnProfile && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-4 right-4 bg-black/80 hover:bg-black/90 text-white border-0 backdrop-blur-sm rounded-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Edit cover photo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Update Cover Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverPhoto" className="text-gray-200">Upload Cover Photo</Label>
                        <Input
                          id="coverPhoto"
                          type="file"
                          accept="image/*"
                          onChange={handleCoverPhotoChange}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <p className="text-sm text-gray-400">
                        Recommended size: 1500x500px (3:1 ratio). Max file size: 5MB
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="absolute -bottom-14 right-6 sm:right-8 md:right-12">
              <div className="relative">
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                  <AvatarImage src={profilePhoto} className="object-cover" />
                  <AvatarFallback className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-orange-500 to-red-600 text-white">
                    {currentUsername.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full h-12 w-12 p-0 shadow-lg bg-orange-500 hover:bg-orange-600 border-2 border-background"
                      >
                        <Camera className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Update Profile Picture</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="profilePhoto" className="text-gray-200">Upload Profile Picture</Label>
                          <Input
                            id="profilePhoto"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          Recommended size: 400x400px (1:1 ratio). Max file size: 2MB
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-14 pb-6 border-b border-gray-800 bg-background">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {displayedName}
                  </h1>
                  {((isOwnProfile ? userType : profileUserType) === 'individual_creator' || (isOwnProfile ? userType : profileUserType) === 'studio_creator') && (
                    <VerificationBadge
                      userType={(isOwnProfile ? userType : profileUserType) as 'individual_creator' | 'studio_creator'}
                      showText={false}
                    />
                  )}
                </div>
                <p className="text-gray-400">@{username || currentUsername}</p>
                <Badge className={`${userTypeInfo.bgColor} ${userTypeInfo.color} border-0 w-fit mt-2`}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {userTypeInfo.label}
                </Badge>
                {bio && (
                  <p className="text-white max-w-2xl mt-3">{bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-4">
                  {location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                    </div>
                  )}
                  {website && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-4 h-4" />
                      <a href={website} className="hover:text-orange-400" target="_blank" rel="noopener noreferrer">
                        {website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-4">
                  {isOwnProfile ? (
                    <div className="text-sm">
                      <span className="font-bold text-white">{stats.videosWatched}</span>
                      <span className="text-gray-400 ml-1">Videos Watched</span>
                    </div>
                  ) : (
                    ((profileUserType === 'individual_creator' || profileUserType === 'studio_creator') && (
                      <div className="text-sm">
                        <span className="font-bold text-white">{uploadedVideos.length}</span>
                        <span className="text-gray-400 ml-1">Videos</span>
                      </div>
                    ))
                  )}
                  <div className="text-sm">
                    <span className="font-bold text-white">{subscriberCount}</span>
                    <span className="text-gray-400 ml-1">Subscribers</span>
                  </div>
                  {(isOwnProfile ? userType : profileUserType) === 'individual_creator' || (isOwnProfile ? userType : profileUserType) === 'studio_creator' && (
                    <div className="text-sm">
                      <span className="font-bold text-white">{posts.length}</span>
                      <span className="text-gray-400 ml-1">Posts</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {!isOwnProfile && (profileUserType === 'individual_creator' || profileUserType === 'studio_creator') && (
                  <Button
                    variant={isSubscribed ? "outline" : "default"}
                    size="sm"
                    className={isSubscribed
                      ? "rounded-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs px-3 py-1"
                      : "rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1"
                    }
                    onClick={() => {
                      if (!user?.id) {
                        alert('Please login to subscribe to creators');
                        navigate('/auth');
                        return;
                      }
                      handleSubscribe();
                    }}
                  >
                    {user?.id && isSubscribed ? (
                      <>
                        <UserMinus className="w-3 h-3 mr-1" />
                        Unsub
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Subscribe
                      </>
                    )}
                  </Button>
                )}
                {!isOwnProfile && profileData?.id && (
                  <MessageButton
                    creatorId={profileData.id}
                    creatorName={displayedName}
                    variant="outline"
                    className="rounded-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-xs px-3 py-1"
                  />
                )}
                <Dialog open={isTipModalOpen} onOpenChange={setIsTipModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-xs px-3 py-1"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Tip
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-gray-900 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-orange-500" />
                        <span>Tip {displayedName}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm">{tipDetails.description}</p>
                      <div className="space-y-3">
                        {tipDetails.paypal && (
                          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-white font-medium">PayPal</span>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => window.open(`https://paypal.me/${tipDetails.paypal}`, '_blank')}
                            >
                              Send Tip
                            </Button>
                          </div>
                        )}
                        {tipDetails.venmo && (
                          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-white font-medium">Venmo</span>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => window.open(`https://venmo.com/${tipDetails.venmo}`, '_blank')}
                            >
                              Send Tip
                            </Button>
                          </div>
                        )}
                        {tipDetails.cashapp && (
                          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-white font-medium">Cash App</span>
                            </div>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => window.open(`https://cash.app/$${tipDetails.cashapp}`, '_blank')}
                            >
                              Send Tip
                            </Button>
                          </div>
                        )}
                        {tipDetails.bitcoin && (
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-white font-medium">Bitcoin</span>
                            </div>
                            <div className="bg-gray-700 p-2 rounded text-xs text-gray-300 break-all">
                              {tipDetails.bitcoin}
                            </div>
                          </div>
                        )}
                        {tipDetails.ethereum && (
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-white font-medium">Ethereum</span>
                            </div>
                            <div className="bg-gray-700 p-2 rounded text-xs text-gray-300 break-all">
                              {tipDetails.ethereum}
                            </div>
                          </div>
                        )}
                        {!tipDetails.paypal && !tipDetails.venmo && !tipDetails.cashapp && !tipDetails.bitcoin && !tipDetails.ethereum && (
                          <div className="text-center py-8">
                            <DollarSign className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400">No tip methods available</p>
                            {isOwnProfile && (
                              <p className="text-sm text-gray-500 mt-2">Set up your tip details in edit profile</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {isOwnProfile && (
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full border-gray-600 text-white hover:bg-gray-800"
                      >
                        Edit profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] bg-gray-900 border-gray-700 flex flex-col">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-white">Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="displayName" className="text-gray-200">Display Name</Label>
                          <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-gray-200">Bio</Label>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself"
                            rows={3}
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-gray-200">Location</Label>
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Your location"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-gray-200">Website</Label>
                          <Input
                            id="website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="border-t border-gray-700 pt-4">
                          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-orange-500" />
                            <span>Tip Details</span>
                          </h4>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="tipDescription" className="text-gray-200">Tip Message</Label>
                              <Textarea
                                id="tipDescription"
                                value={tipDetails.description}
                                onChange={(e) => setTipDetails(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Support my content creation journey! 💖"
                                rows={2}
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="paypal" className="text-gray-200">PayPal Username</Label>
                                <Input
                                  id="paypal"
                                  value={tipDetails.paypal}
                                  onChange={(e) => setTipDetails(prev => ({ ...prev, paypal: e.target.value }))}
                                  placeholder="username"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="venmo" className="text-gray-200">Venmo Username</Label>
                                <Input
                                  id="venmo"
                                  value={tipDetails.venmo}
                                  onChange={(e) => setTipDetails(prev => ({ ...prev, venmo: e.target.value }))}
                                  placeholder="username"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cashapp" className="text-gray-200">Cash App Username</Label>
                              <Input
                                id="cashapp"
                                value={tipDetails.cashapp}
                                onChange={(e) => setTipDetails(prev => ({ ...prev, cashapp: e.target.value }))}
                                placeholder="username (without $)"
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bitcoin" className="text-gray-200">Bitcoin Address</Label>
                              <Input
                                id="bitcoin"
                                value={tipDetails.bitcoin}
                                onChange={(e) => setTipDetails(prev => ({ ...prev, bitcoin: e.target.value }))}
                                placeholder="Your Bitcoin wallet address"
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ethereum" className="text-gray-200">Ethereum Address</Label>
                              <Input
                                id="ethereum"
                                value={tipDetails.ethereum}
                                onChange={(e) => setTipDetails(prev => ({ ...prev, ethereum: e.target.value }))}
                                placeholder="Your Ethereum wallet address"
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                        <Button
                          onClick={async () => {
                            if (!user?.id) return;
                            try {
                              const basicProfileData = {
                                id: user.id,
                                username: currentUsername || user.email?.split('@')[0] || 'user',
                                full_name: displayName,
                                avatar_url: profilePhoto,
                                user_type: userType || 'user',
                                updated_at: new Date().toISOString()
                              };
                              const optionalColumns = {
                                bio: bio,
                                location: location,
                                website: website,
                                cover_photo_url: coverPhoto,
                                tip_paypal: tipDetails.paypal,
                                tip_venmo: tipDetails.venmo,
                                tip_cashapp: tipDetails.cashapp,
                                tip_bitcoin: tipDetails.bitcoin,
                                tip_ethereum: tipDetails.ethereum,
                                tip_description: tipDetails.description
                              };
                              let { error } = await supabase
                                .from('profiles')
                                .upsert({ ...basicProfileData, ...optionalColumns }, {
                                  onConflict: 'id'
                                });
                              if (error && error.message.includes('column')) {
                                console.log('Some columns not available, saving basic profile data only');
                                const { error: basicError } = await supabase
                                  .from('profiles')
                                  .upsert(basicProfileData, {
                                    onConflict: 'id'
                                  });
                                if (basicError) {
                                  console.error('Error saving basic profile:', basicError);
                                  alert('Error saving profile. Please try again.');
                                } else {
                                  console.log('Basic profile saved successfully');
                                  alert('Profile saved successfully! (Some features may require database updates)');
                                }
                              } else if (error) {
                                console.error('Error saving profile:', error);
                                alert('Error saving profile. Please try again.');
                              } else {
                                console.log('Profile saved successfully');
                                alert('Profile saved successfully!');
                              }
                            } catch (error) {
                              console.error('Error saving profile:', error);
                              alert('Error saving profile. Please try again.');
                            }
                            setIsEditing(false);
                          }}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Tabs defaultValue="stream" className="w-full">
              <TabsList className={`grid w-full ${userType === 'user' ? 'grid-cols-4' : 'grid-cols-4'} bg-gray-800 border-gray-700`}>
                <TabsTrigger value="stream" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">Stream</TabsTrigger>
                <TabsTrigger value="favorites" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">Videos</TabsTrigger>
                <TabsTrigger value="watchlist" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">Photos</TabsTrigger>
                {userType === 'user' ? (
                  <TabsTrigger value="upgrade" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">More</TabsTrigger>
                ) : (
                  <TabsTrigger value="uploads" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">More</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="stream" className="mt-6 relative">
                <div className="space-y-6 max-w-full overflow-x-hidden">
                  {isOwnProfile && (userType === 'individual_creator' || userType === 'studio_creator') && (
                    <Dialog open={isCreatePostModalOpen} onOpenChange={setIsCreatePostModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg border-0 z-50">
                          <Send className="h-6 w-6 text-white" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
                        <DialogHeader className="border-b border-gray-700 pb-4">
                          <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setIsCreatePostModalOpen(false)}>
                              Cancel
                            </Button>
                            <DialogTitle className="text-white text-lg font-normal">
                              What's happening?
                            </DialogTitle>
                            <Button
                              onClick={handleCreatePost}
                              disabled={(!newPostContent.trim() && !newPostMedia) || isPostingLoading}
                              className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-6 py-1 text-sm"
                            >
                              {isPostingLoading ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                              ) : (
                                'Post'
                              )}
                            </Button>
                          </div>
                        </DialogHeader>
                        <div className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={profilePhoto} />
                              <AvatarFallback className="bg-orange-500 text-white">
                                {currentUsername.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <Textarea
                                placeholder="What's happening?"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className="bg-transparent border-0 resize-none text-lg placeholder-gray-500 focus:ring-0 focus:border-0 min-h-[120px] text-white"
                                rows={4}
                              />
                              {newPostMediaPreview && (
                                <div className="mt-3 relative inline-block">
                                  {newPostMedia?.type.startsWith('image/') ? (
                                    <img src={newPostMediaPreview} alt="Preview" className="max-h-40 rounded-lg" />
                                  ) : (
                                    <video src={newPostMediaPreview} className="max-h-40 rounded-lg" controls />
                                  )}
                                  <Button
                                    onClick={() => {
                                      setNewPostMedia(null);
                                      setNewPostMediaPreview('');
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 h-6 w-6"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </Button>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                                <div className="flex items-center space-x-4">
                                  <Label htmlFor="modal-media-upload" className="cursor-pointer">
                                    <ImageIcon className="w-5 h-5 text-purple-500 hover:text-purple-400" />
                                    <Input
                                      id="modal-media-upload"
                                      type="file"
                                      accept="image/*,video/*"
                                      className="hidden"
                                      onChange={handleMediaUpload}
                                    />
                                  </Label>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Everyone can reply
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {isOwnProfile ? (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Your Feed</h2>
                      {feedLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                          <p className="text-gray-400 mt-4">Loading feed...</p>
                        </div>
                      ) : feedPosts.length > 0 ? (
                        <div className="space-y-4 max-w-full">
                          {feedPosts.map(post => (
                            <div key={post.id} className="max-w-full overflow-hidden">
                              <PostCard post={post} showDelete={post.creator_id === user?.id} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-white">Your feed is empty</h3>
                          <p className="text-gray-400">
                            Subscribe to creators to see their posts in your feed!
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">{displayedName}'s Posts</h2>
                      {postsLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                          <p className="text-gray-400 mt-4">Loading posts...</p>
                        </div>
                      ) : posts.length > 0 ? (
                        <div className="space-y-4 max-w-full">
                          {posts.map(post => (
                            <div key={post.id} className="max-w-full overflow-hidden">
                              <PostCard post={post} showDelete={false} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <MessageCircle className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-white">No posts yet</h3>
                          <p className="text-gray-400">
                            {displayedName} hasn't shared anything yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isOwnProfile && (userType === 'individual_creator' || userType === 'studio_creator') && (
                    <div className="border-t border-gray-800 pt-6">
                      <h2 className="text-xl font-bold text-white mb-4">Your Posts ({posts.length})</h2>
                      {postsLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                          <p className="text-gray-400 mt-4">Loading your posts...</p>
                        </div>
                      ) : posts.length > 0 ? (
                        <div className="space-y-4 max-w-full">
                          {posts.map(post => (
                            <div key={post.id} className="max-w-full overflow-hidden">
                              <PostCard post={post} showDelete={isOwnProfile && (userType === 'individual_creator' || userType === 'studio_creator')} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <MessageCircle className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-white">No posts yet</h3>
                          <p className="text-gray-400">
                            Share your first post with your subscribers!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="favorites" className="mt-6">
                <div className="w-full">
                  {((isOwnProfile ? userType : profileUserType) === 'individual_creator' || (isOwnProfile ? userType : profileUserType) === 'studio_creator') && (
                    <div className="mb-8">
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">
                          {isOwnProfile ? 'My Uploads' : `${displayedName}'s Uploads`} ({uploadedVideos.length})
                        </h2>
                      </div>
                      {uploadedVideos.length > 0 ? (
                        <div
                          className="w-full max-w-none"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '16px',
                            width: '100vw',
                            maxWidth: '100vw',
                            margin: '0 -16px',
                            padding: '0 16px'
                          }}
                        >
                          {uploadedVideos.map((video) => (
                            <div
                              key={video.id}
                              className="group cursor-pointer w-full"
                              onClick={() => navigate(video.is_moment ? `/moments?start=${video.id}` : video.is_premium ? `/premium/video/${video.id}` : `/video/${video.id}`)}
                            >
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
                                {video.thumbnail_url && (
                                  <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                  />
                                )}
                                {video.is_premium && (
                                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded font-bold">
                                    <Crown className="w-3 h-3 mr-1 inline" />
                                    PREMIUM
                                  </div>
                                )}
                                {isOwnProfile && !video.is_premium && !video.is_moment && (
                                  <div className="absolute top-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded">
                                    MY VIDEO
                                  </div>
                                )}
                                {video.is_moment && (
                                  <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded">
                                    MOMENT
                                  </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {video.duration || '00:00'}
                                </div>
                              </div>
                              <h4 className="font-medium text-sm line-clamp-2 mb-1 text-white">{video.title}</h4>
                              <div className="flex items-center space-x-3 text-xs text-gray-400">
                                <span className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{video.views?.toLocaleString() || 0}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{video.likes?.toLocaleString() || 0}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Video className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                          <p className="text-gray-400 text-sm">
                            {isOwnProfile ? 'No uploads yet' : 'No uploads yet'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className={`mb-8 ${((userType === 'individual_creator' || userType === 'studio_creator') ? 'border-t border-gray-800 pt-8' : '')}`}>
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">Liked Videos ({favorites.length})</h2>
                      </div>
                      {favorites.length > 0 ? (
                        <>
                          <div
                            className="w-full max-w-none"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '16px',
                              width: '100vw',
                              maxWidth: '100vw',
                              margin: '0 -16px',
                              padding: '0 16px'
                            }}
                          >
                            {(showMoreFavorites ? favorites : favorites.slice(0, 15)).map((video) => (
                              <div
                                key={video.id}
                                className="group cursor-pointer w-full"
                                onClick={() => navigate(video.is_moment ? `/moments?start=${video.id}` : `/video/${video.id}`)}
                              >
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
                                  {video.thumbnail_url && (
                                    <img
                                      src={video.thumbnail_url}
                                      alt={video.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      loading="lazy"
                                    />
                                  )}
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {video.duration}
                                  </div>
                                </div>
                                <h4 className="font-medium text-sm line-clamp-2 mb-1 text-white">{video.title}</h4>
                                <div className="flex items-center space-x-3 text-xs text-gray-400">
                                  <span className="flex items-center space-x-1">
                                    <Eye className="w-3 h-3" />
                                    <span>{video.views?.toLocaleString() || 0}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {favorites.length > 15 && (
                            <div className="text-center mt-6">
                              <Button
                                variant="outline"
                                className="rounded-full border-gray-600 text-white hover:bg-gray-800 px-8"
                                onClick={() => setShowMoreFavorites(!showMoreFavorites)}
                              >
                                {showMoreFavorites ? 'Show Less' : `Show More (${favorites.length - 15} more)`}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Heart className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-white">No liked videos yet</h3>
                          <p className="text-gray-400">
                            Videos you like will appear here. Start exploring to build your collection!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className={`${((userType === 'individual_creator' || userType === 'studio_creator') || favorites.length > 0) ? 'border-t border-gray-800 pt-8' : ''}`}>
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">Watch History ({watchHistory.length})</h2>
                      </div>
                      {watchHistory.length > 0 ? (
                        <div
                          className="w-full max-w-none"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '16px',
                            width: '100vw',
                            maxWidth: '100vw',
                            margin: '0 -16px',
                            padding: '0 16px'
                          }}
                        >
                          {watchHistory.slice(0, 30).map((video) => (
                            <div
                              key={`${video.id}-${video.watched_at || video.created_at}`}
                              className="group cursor-pointer w-full"
                              onClick={() => navigate(video.is_moment ? `/moments?start=${video.id}` : `/video/${video.id}`)}
                            >
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
                                {video.thumbnail_url && (
                                  <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                  />
                                )}
                                <div className="absolute top-2 left-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded">
                                  WATCHED
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {video.duration}
                                </div>
                              </div>
                              <h4 className="font-medium text-sm line-clamp-2 mb-1 text-white">{video.title}</h4>
                              <div className="flex items-center space-x-3 text-xs text-gray-400">
                                <span className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{video.views?.toLocaleString() || 0}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(video.watched_at).toLocaleDateString()}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Play className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-white">No viewing history</h3>
                          <p className="text-gray-400">
                            Your recently watched videos will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {!isOwnProfile && (
                    <div className={`${((profileUserType === 'individual_creator' || profileUserType === 'studio_creator') ? 'border-t border-gray-800 pt-8' : '')}`}>
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-white">That's all for now</h3>
                        <p className="text-gray-400">
                          {displayedName}'s uploaded content is shown above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="watchlist" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Watch later list is empty</h3>
                      <p className="text-muted-foreground">
                        Save videos to watch later and never miss your favorite content!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history" className="mt-6">
                <div className="px-4 sm:px-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">Watched ({watchHistory.length})</h2>
                    {watchHistory.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {watchHistory.slice(0, 20).map((video) => (
                          <div
                            key={`${video.id}-${video.watched_at}`}
                            className="group cursor-pointer"
                            onClick={() => navigate(video.is_moment ? `/moments?start=${video.id}` : `/video/${video.id}`)}
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
                              {video.thumbnail_url && (
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              )}
                              <div className="absolute top-2 left-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded">
                                WATCHED
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {video.duration}
                              </div>
                            </div>
                            <h4 className="font-medium text-sm line-clamp-2 mb-1 text-white">{video.title}</h4>
                            <div className="flex items-center space-x-3 text-xs text-gray-400">
                              <span className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{video.views?.toLocaleString() || 0}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(video.watched_at).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Play className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-white">No viewing history</h3>
                        <p className="text-gray-400">
                          Your recently watched videos will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              {userType !== 'user' && (
                <TabsContent value="uploads" className="mt-6">
                  <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg">
                      <UploadPage />
                    </div>
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white">My Uploads ({uploadedVideos.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {statsLoading ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-4">Loading uploads...</p>
                          </div>
                        ) : uploadedVideos.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {uploadedVideos.map((video) => (
                              <div key={video.id} className="group cursor-pointer" onClick={() => navigate(video.is_moment ? `/moments?start=${video.id}` : video.is_premium ? `/premium/video/${video.id}` : `/video/${video.id}`)}>
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
                                  {video.thumbnail_url && (
                                    <img
                                      src={video.thumbnail_url}
                                      alt={video.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      loading="lazy"
                                    />
                                  )}
                                  {video.is_premium && (
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded font-bold">
                                      <Crown className="w-3 h-3 mr-1 inline" />
                                      PREMIUM
                                    </div>
                                  )}
                                  {video.is_moment && (
                                    <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded">
                                      MOMENT
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {video.duration || '00:00'}
                                  </div>
                                </div>
                                <h4 className="font-medium text-sm line-clamp-2 mb-1 text-white">{video.title}</h4>
                                <div className="flex items-center space-x-3 text-xs text-gray-400">
                                  <span className="flex items-center space-x-1">
                                    <Eye className="w-3 h-3" />
                                    <span>{video.views?.toLocaleString() || 0}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Heart className="w-3 h-3" />
                                    <span>{video.likes?.toLocaleString() || 0}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Video className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold mb-2 text-white">No uploads yet</h3>
                            <p className="text-gray-400 mb-4">
                              {userType === 'individual_creator'
                                ? "Use the upload form above to start sharing your content!"
                                : "Use the upload form above to manage your studio's content!"
                              }
                            </p>
                            <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border max-w-md mx-auto">
                              <h4 className="font-semibold text-sm mb-2 flex items-center justify-center">
                                <Crown className="w-4 h-4 mr-2 text-purple-500" />
                                {userType === 'studio_creator' ? 'Pro Studio Benefits' : 'Creator Benefits'}
                              </h4>
                              <ul className="text-xs text-muted-foreground space-y-1 text-left">
                                <li>• Monetize your content</li>
                                <li>• Earn from views & subscriptions</li>
                                <li>• Build your fanbase</li>
                                <li>• Analytics & insights</li>
                                {userType === 'studio_creator' && (
                                  <>
                                    <li>• Team collaboration tools</li>
                                    <li>• Advanced revenue sharing</li>
                                    <li>• Priority support</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
              {userType === 'user' && (
                <TabsContent value="upgrade" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Want to create content?</h3>
                        <p className="text-muted-foreground mb-6">
                          Become a creator to upload videos, build your audience, and earn revenue from your content.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
                          <Card className="p-4 border-2 hover:border-orange-500 transition-colors cursor-pointer">
                            <div className="text-center">
                              <Video className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                              <h4 className="font-semibold mb-2">Individual Creator</h4>
                              <p className="text-sm text-muted-foreground mb-3">Perfect for solo content creators</p>
                              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                                <li>• Upload & monetize content</li>
                                <li>• Build your audience</li>
                                <li>• Analytics & insights</li>
                                <li>• Revenue from views</li>
                              </ul>
                              <Button variant="outline" className="w-full">
                                Become Individual Creator
                              </Button>
                            </div>
                          </Card>
                          <Card className="p-4 border-2 hover:border-purple-500 transition-colors cursor-pointer">
                            <div className="text-center">
                              <Crown className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                              <h4 className="font-semibold mb-2">Pro Studio</h4>
                              <p className="text-sm text-muted-foreground mb-3">For teams and agencies</p>
                              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                                <li>• Team management</li>
                                <li>• Advanced revenue sharing</li>
                                <li>• Priority support</li>
                                <li>• Studio branding</li>
                              </ul>
                              <Button variant="outline" className="w-full">
                                Upgrade to Pro Studio
                              </Button>
                            </div>
                          </Card>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ready to start your creator journey? Choose the plan that fits your needs.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;