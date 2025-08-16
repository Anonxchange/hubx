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
  Post
} from '@/services/socialFeedService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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

const ProfilePage = () => {
  const { user, userType, loading } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const [profileLoadComplete, setProfileLoadComplete] = useState(false);
  
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

  // First useEffect to get current user's username
  useEffect(() => {
    const fetchCurrentUserUsername = async () => {
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          
          setCurrentUserUsername(profile?.username || null);
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
      let targetProfileData: any = null;

      // If viewing someone else's profile by username (or guest viewing any profile)
      if (username && (currentUserUsername !== username || !currentUserUsername)) {
        try {
          // Query with only the basic columns that definitely exist
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, user_type, avatar_url')
            .eq('username', username)
            .single();

          if (error || !data) {
            console.error('Profile not found:', error);
            // Handle case where profile is not found, perhaps show a 404 or default state
            return;
          }

          targetUserId = data.id;
          targetProfileData = data; // Store the fetched data

          // Set public profile data for display with available columns
          setDisplayName(data.full_name || data.username || '');
          setBio('Welcome to my profile! 🌟'); // Default values for missing columns
          setLocation(''); 
          setWebsite('');
          setProfilePhoto(data.avatar_url || '');
          setCoverPhoto('');

          // Set profile user type for proper display
          if (data.user_type) {
            setProfileUserType(data.user_type as UserType);
          }
        } catch (error) {
          console.error('Error fetching public profile:', error);
          return;
        }
      }

      // Fetch detailed stats and tip details only if we have a target user ID
      // For own profile, targetUserId is user?.id. For others, it's from fetched data.
      if (targetUserId) {
        setStatsLoading(true);
        try {
          // Query profile with only basic columns that exist
          const profilePromise = supabase
            .from('profiles')
            .select('id, username, full_name, user_type, avatar_url')
            .eq('id', targetUserId)
            .maybeSingle();

          const promises = [
            getUserStats(targetUserId),
            getUserFavorites(targetUserId),
            getUserWatchHistory(targetUserId),
            profilePromise
          ];

          // If target user is a creator, also fetch their uploaded videos
          const targetUserType = targetProfileData?.user_type || userType; // Use fetched type or current user's type
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
          const uploadsResponse = rest[0]; // Get uploadsResponse if it exists

          if (typeof userStats === 'object' && 'videosWatched' in userStats) {
            setStats(userStats);
          }
          if (Array.isArray(userFavorites)) {
            setFavorites(userFavorites);
          }
          if (Array.isArray(userWatchHistory)) {
            setWatchHistory(userWatchHistory);
          }

          // Load profile data including tip details if not already loaded from public fetch
          if (!targetProfileData && profileResponse && 'data' in profileResponse && !profileResponse.error && profileResponse.data) {
            const profile = profileResponse.data;

            // Set profile fields with available data
            setDisplayName(profile.full_name || profile.username || '');
            setBio('Welcome to my profile! 🌟'); // Default values
            setLocation('');
            setWebsite('');
            setProfilePhoto(profile.avatar_url || '');
            setCoverPhoto('');

            // Set default tip details since tip columns don't exist
            setTipDetails({
              paypal: '',
              venmo: '',
              cashapp: '',
              bitcoin: '',
              ethereum: '',
              description: 'Support my content creation journey! 💖'
            });
          } else if (!targetProfileData && profileResponse && 'error' in profileResponse && profileResponse.error) {
            console.log('Profile not found, will create on first save');
          }

          if (uploadsResponse && 'data' in uploadsResponse && !uploadsResponse.error) {
            setUploadedVideos(uploadsResponse.data || []);
          } else if (uploadsResponse && 'error' in uploadsResponse && uploadsResponse.error) {
            console.error('Error fetching uploaded videos:', uploadsResponse.error);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setStatsLoading(false);
        }
      } else {
        // If no targetUserId (e.g., guest viewing a non-existent username or profile page without logged-in user)
        setStatsLoading(false);
      }
    };

    const fetchSocialData = async () => {
      let targetUserId = user?.id;

      // If viewing someone else's profile by username (or guest viewing any profile)
      if (username && (currentUserUsername !== username || !currentUserUsername)) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();

          if (data) {
            targetUserId = data.id;
          } else {
            console.log('Profile not found for username:', username);
            // If username doesn't exist, we cannot fetch social data for them
            targetUserId = null;
          }
        } catch (error) {
          console.error('Error fetching user ID for posts:', error);
          setPostsLoading(false);
          return;
        }
      }

      // Fetch creator posts for the target user
      if (targetUserId) {
        setPostsLoading(true);
        const creatorPosts = await getCreatorPosts(targetUserId);
        setPosts(creatorPosts);
        setPostsLoading(false);

        // Get subscriber count
        const subCount = await getSubscriberCount(targetUserId);
        setSubscriberCount(subCount);

        // Check if current user is subscribed (only if viewing another user's profile and logged in)
        if (targetUserId && targetUserId !== user?.id && user?.id) {
          const subscribed = await isSubscribedToCreator(targetUserId);
          setIsSubscribed(subscribed);
        }
      }

      // Fetch feed posts only for own profile (authenticated user viewing their own profile)
      if (user?.id && (!username || (currentUserUsername && username === currentUserUsername))) {
        setFeedLoading(true);
        const feed = await getFeedPosts(50);
        setFeedPosts(feed);
        setFeedLoading(false);
      } else {
        setFeedLoading(false);
      }
    };

    fetchUserData();
    fetchSocialData();
  }, [user?.id, userType, username, currentUserUsername, profileLoadComplete]); // Added dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth only if trying to access own profile (no username param) without being logged in
  if (!username && !user) return <Navigate to="/auth" replace />;

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPhoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const [profileUserType, setProfileUserType] = useState<UserType | null>(userType);

  const getUserTypeInfo = () => {
    // Use profileUserType for display, which can be set from fetched profile data
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

  // Get user's display name or fallback to email prefix
  const currentUsername = user?.email?.split('@')[0] || 'User';
  const displayedName = displayName || currentUsername;

  // Social Feed Functions
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostMedia) return;

    setIsPostingLoading(true);
    try {
      let mediaUrl = '';
      let mediaType = '';

      // Upload media if present
      if (newPostMedia && user?.id) {
        const fileName = `${user.id}/${Date.now()}-${newPostMedia.name}`;
        const { data, error } = await supabase.storage
          .from('post_media')
          .upload(fileName, newPostMedia);

        if (error) {
          console.error('Error uploading media:', error);
          throw new Error('Failed to upload media');
        }

        const { data: urlData } = supabase.storage
          .from('post_media')
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
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
    // Ensure we have a target user ID and the current user is logged in
    if (!username || isOwnProfile || !user?.id) return;

    // Get target user ID from username (redundant if already fetched in useEffect, but safe)
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

    if (!targetUserId) return; // Cannot subscribe if target user ID is not found

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

  const PostCard: React.FC<{ post: Post; showDelete?: boolean }> = ({ post, showDelete = false }) => (
    <Card className="bg-gray-900 border-gray-800 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.creator?.profile_picture_url} />
            <AvatarFallback className="bg-orange-500 text-white">
              {post.creator?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-white">{post.creator?.full_name || post.creator?.username}</span>
              {(post.creator?.user_type === 'individual_creator' || post.creator?.user_type === 'studio_creator') && (
                <VerificationBadge userType={post.creator.user_type} showText={false} />
              )}
              <span className="text-gray-400 text-sm">@{post.creator?.username}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-400 text-sm">{formatPostDate(post.created_at)}</span>
              {showDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => handleDeletePost(post.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <p className="text-white mb-3">{post.content}</p>

            {post.media_url && (
              <div className="mb-3 rounded-lg overflow-hidden">
                {post.media_type === 'image' ? (
                  <img
                    src={post.media_url}
                    alt="Post media"
                    className="w-full max-h-96 object-cover"
                  />
                ) : post.media_type === 'video' ? (
                  <video
                    src={post.media_url}
                    controls
                    className="w-full max-h-96"
                  />
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
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments_count}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Ad Section - Zone ID 5660534 - Positioned closer to header */}
      <div className="w-full bg-gray-900 py-2 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <AdComponent zoneId="5660534" className="w-full" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Cover Photo with Profile Picture Container - Positioned closer to ads */}
        <div className="relative -mt-2">
          <div
            className="w-full h-32 sm:h-36 md:h-40 bg-gradient-to-br from-gray-800 via-gray-700 to-black relative overflow-hidden"
            style={{
              backgroundImage: coverPhoto ? `url(${coverPhoto})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Change Cover Button */}
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

          {/* Profile Picture - Positioned to overlap cover photo */}
          <div className="absolute -bottom-14 right-6 sm:right-8 md:right-12">
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                <AvatarImage src={profilePhoto || user?.user_metadata?.avatar_url} className="object-cover" />
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

        {/* Profile Info Section */}
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
              <p className="text-gray-400">@{currentUsername}</p>
              <Badge className={`${userTypeInfo.bgColor} ${userTypeInfo.color} border-0 w-fit mt-2`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {userTypeInfo.label}
              </Badge>

              {/* Bio */}
              {bio && (
                <p className="text-white max-w-2xl mt-3">{bio}</p>
              )}

              {/* Meta info */}
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

              {/* Stats - Twitter style */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="text-sm">
                  <span className="font-bold text-white">{stats.videosWatched}</span>
                  <span className="text-gray-400 ml-1">Videos Watched</span>
                </div>
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

            {/* Action Buttons - Twitter style positioning */}
            <div className="flex space-x-2 mt-auto">
              {/* Subscribe Button - Show only for logged-in users viewing other creators */}
              {!isOwnProfile && user?.id && (profileUserType === 'individual_creator' || profileUserType === 'studio_creator') && (
                <Button
                  variant={isSubscribed ? "outline" : "default"}
                  className={isSubscribed
                    ? "rounded-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    : "rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                  }
                  onClick={handleSubscribe}
                >
                  {isSubscribed ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unsubscribe
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
              )}
              {/* Tip Button - Always visible */}
              <Dialog open={isTipModalOpen} onOpenChange={setIsTipModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
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

                    {/* Payment Methods */}
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

                      {/* Tip Details Section */}
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

                    {/* Fixed Save Button at Bottom */}
                    <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                      <Button
                        onClick={async () => {
                          if (!user?.id) return;

                          try {
                            const profileData = {
                              id: user.id,
                              full_name: displayName,
                              bio: bio,
                              location: location,
                              website: website,
                              avatar_url: profilePhoto,
                              cover_photo_url: coverPhoto,
                              tip_paypal: tipDetails.paypal,
                              tip_venmo: tipDetails.venmo,
                              tip_cashapp: tipDetails.cashapp,
                              tip_bitcoin: tipDetails.bitcoin,
                              tip_ethereum: tipDetails.ethereum,
                              tip_description: tipDetails.description,
                              user_type: userType || 'user',
                              updated_at: new Date().toISOString()
                            };

                            const { error } = await supabase
                              .from('profiles')
                              .upsert(profileData, {
                                onConflict: 'id'
                              });

                            if (error) {
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

        {/* Content Tabs */}
        <div className="mt-8 px-4 sm:px-6">
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
              <div className="space-y-6">
                {/* Floating Plus Button - Only for creators on their own profile */}
                {isOwnProfile && (userType === 'individual_creator' || userType === 'studio_creator') && (
                  <Dialog open={isCreatePostModalOpen} onOpenChange={setIsCreatePostModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg border-0 z-50"
                        size="sm"
                      >
                        <Send className="h-6 w-6 text-white" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
                      <DialogHeader className="border-b border-gray-700 pb-4">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                            onClick={() => setIsCreatePostModalOpen(false)}
                          >
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
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              'Post'
                            )}
                          </Button>
                        </div>
                      </DialogHeader>

                      <div className="pt-4">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profilePhoto || user?.user_metadata?.avatar_url} />
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
                                  <img
                                    src={newPostMediaPreview}
                                    alt="Preview"
                                    className="max-h-40 rounded-lg"
                                  />
                                ) : (
                                  <video
                                    src={newPostMediaPreview}
                                    className="max-h-40 rounded-lg"
                                    controls
                                  />
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

                {/* Feed Section */}
                {isOwnProfile ? (
                  // Own profile - show subscribed creators' posts
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Your Feed</h2>
                    {feedLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading feed...</p>
                      </div>
                    ) : feedPosts.length > 0 ? (
                      <div className="space-y-4">
                        {feedPosts.map(post => (
                          <PostCard key={post.id} post={post} showDelete={false} />
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
                  // Other creator's profile - show their posts
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">{displayedName}'s Posts</h2>
                    {postsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading posts...</p>
                      </div>
                    ) : posts.length > 0 ? (
                      <div className="space-y-4">
                        {posts.map(post => (
                          <PostCard key={post.id} post={post} showDelete={false} />
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

                {/* Own Posts Section - Only for creators on their own profile */}
                {isOwnProfile && (userType === 'individual_creator' || userType === 'studio_creator') && (
                  <div className="border-t border-gray-800 pt-6">
                    <h2 className="text-xl font-bold text-white mb-4">Your Posts ({posts.length})</h2>
                    {postsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading your posts...</p>
                      </div>
                    ) : posts.length > 0 ? (
                      <div className="space-y-4">
                        {posts.map(post => (
                          <PostCard key={post.id} post={post} showDelete={true} />
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
                {/* For Creators: Show Uploaded Content First */}
                {(userType === 'individual_creator' || userType === 'studio_creator') && (
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-white">My Uploads ({uploadedVideos.length})</h2>
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
                            onClick={() => navigate(`/video/${video.id}`)}
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
                              <div className="absolute top-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded">
                                MY VIDEO
                              </div>
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
                        <p className="text-gray-400 text-sm">No uploads yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Favorite Videos Section */}
                <div className="mb-8 {(userType === 'individual_creator' || userType === 'studio_creator') ? 'border-t border-gray-800 pt-8' : ''}">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">Favs Videos ({favorites.length})</h2>
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
                            onClick={() => navigate(`/video/${video.id}`)}
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

                      {/* Show More Button */}
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
                      <h3 className="text-lg font-semibold mb-2 text-white">No favorites yet</h3>
                      <p className="text-gray-400">
                        Videos you like will appear here. Start exploring to build your collection!
                      </p>
                    </div>
                  )}
                </div>

                {/* Watched Videos Section */}
                <div className="border-t border-gray-800 pt-8">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">Watched ({watchHistory.length})</h2>
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
                          onClick={() => navigate(`/video/${video.id}`)}
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
                          onClick={() => navigate(`/video/${video.id}`)}
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
                  {/* Upload Form Section */}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg">
                    <UploadPage />
                  </div>

                  {/* My Uploads Section */}
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
                            <div key={video.id} className="group cursor-pointer" onClick={() => navigate(`/video/${video.id}`)}>
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

                          {/* Creator Benefits Reminder */}
                          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border max-w-md mx-auto">
                            <h4 className="font-semibold text-sm mb-2 flex items-center justify-center">
                              <Crown className="w-4 h-4 mr-2 text-purple-500" />
                              {userType === 'studio_creator' ? 'Pro Studio Benefits' : 'Creator Benefits'}
                            </h4>
                            <ul className="text-xs text-muted-foreground space-y-1 text-left">
                              <li>• Monetize your content</li>
                              <li>• Earn from views & subscriptions</li>
                              <li>• Build your fanbase</li>
                              <li>• Analytics dashboard</li>
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

            {/* Regular Users - No Upload Tab */}
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
                        {/* Individual Creator Option */}
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

                        {/* Studio Creator Option */}
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

      <Footer />
    </div>
  );
};

export default ProfilePage;