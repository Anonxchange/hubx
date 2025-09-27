import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, DollarSign, MoreHorizontal, MessageCircle, UserPlus, CheckCircle, Camera, Play, List, Heart, Upload, Share, Star, Repeat2, Image as ImageIcon, Video, Globe, Lock, Eye, ThumbsUp, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  subscribeToCreator, 
  unsubscribeFromCreator, 
  isSubscribedToCreator, 
  getSubscriberCount,
  getCreatorPosts,
  createPost,
  Post
} from '@/services/socialFeedService';
import { getUserStats, UserStats } from '@/services/userStatsService';
import { getUserFavorites, getUserWatchHistory } from '@/services/userStatsService';
import { uploadCoverPhoto, uploadProfilePicture } from '@/services/bunnyStorageService';
import MessageButton from '@/components/MessageButton';
import AdComponent from '@/components/AdComponent';
import VideoCard from '@/components/VideoCard';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import TipModal from '@/components/TipModal';
import ShareModal from '@/components/ShareModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  cover_photo_url: string;
  user_type: string;
  verified?: boolean;
  tip_paypal?: string;
  tip_venmo?: string;
  tip_cashapp?: string;
  tip_bitcoin?: string;
  tip_ethereum?: string;
  tip_description?: string;
}

const ProfilePage = () => {
  const { user, userType, loading: authLoading } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Post creation state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [newPostPrivacy, setNewPostPrivacy] = useState('public');
  const [isPostingLoading, setIsPostingLoading] = useState(false);

  // Post editing state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostPrivacy, setEditPostPrivacy] = useState('public');
  const [isEditingLoading, setIsEditingLoading] = useState(false);

  // Edit profile state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTipPaypal, setEditTipPaypal] = useState('');
  const [editTipVenmo, setEditTipVenmo] = useState('');
  const [editTipCashapp, setEditTipCashapp] = useState('');
  const [editTipBitcoin, setEditTipBitcoin] = useState('');
  const [editTipEthereum, setEditTipEthereum] = useState('');
  const [editTipDescription, setEditTipDescription] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Share profile state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Video pagination state
  const [showMoreVideos, setShowMoreVideos] = useState(false);
  const [showMorePremiumVideos, setShowMorePremiumVideos] = useState(false);

  // Determine if viewing own profile
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const isOwnProfile = !username || (currentUserUsername && username === currentUserUsername);

  // Function to detect and embed video links in post content
  const renderPostContent = (content: string) => {
    // Enhanced regex patterns for different video URLs including internal video links
    const videoPatterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
      /https?:\/\/[^\s]+\.(mp4|webm|ogg)(\?[^\s]*)?/i,
      // Internal video links - matches /video/{id} or site.com/video/{id}
      /(?:https?:\/\/[^\/\s]+)?\/video\/([a-f0-9\-]{36})/i,
      // Premium video links
      /(?:https?:\/\/[^\/\s]+)?\/premium\/video\/([a-f0-9\-]{36})/i,
      // Moments links
      /(?:https?:\/\/[^\/\s]+)?\/moments\?start=([a-f0-9\-]{36})/i
    ];

    const lines = content.split('\n');
    const processedContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let hasVideo = false;
      
      // Check each video pattern
      for (const pattern of videoPatterns) {
        const match = line.match(pattern);
        if (match) {
          hasVideo = true;
          const originalUrl = match[0];
          
          // Get text before and after the URL
          const textBefore = line.substring(0, match.index);
          const textAfter = line.substring((match.index || 0) + match[0].length);
          
          // Add text before URL first
          if (textBefore.trim()) {
            processedContent.push(
              <p key={`text-before-${i}`} className="text-white text-[15px] leading-5">
                {textBefore.trim()}
              </p>
            );
          }
          
          // Then add the video embed based on type
          // Internal video links (regular videos)
          if (originalUrl.includes('/video/') && !originalUrl.includes('/premium/')) {
            const videoId = match[1];
            processedContent.push(
              <InternalVideoEmbed 
                key={`internal-video-${i}`} 
                videoId={videoId} 
                originalUrl={originalUrl}
                type="video"
              />
            );
          }
          // Internal premium video links
          else if (originalUrl.includes('/premium/video/')) {
            const videoId = match[1];
            processedContent.push(
              <InternalVideoEmbed 
                key={`premium-video-${i}`} 
                videoId={videoId} 
                originalUrl={originalUrl}
                type="premium"
              />
            );
          }
          // Internal moments links
          else if (originalUrl.includes('/moments?start=')) {
            const videoId = match[1];
            processedContent.push(
              <InternalVideoEmbed 
                key={`moment-video-${i}`} 
                videoId={videoId} 
                originalUrl={originalUrl}
                type="moment"
              />
            );
          }
          // YouTube embedding
          else if (match[0].includes('youtube.com') || match[0].includes('youtu.be')) {
            const videoId = match[1];
            processedContent.push(
              <div key={`video-${i}`} className="my-3">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          }
          // Vimeo embedding  
          else if (match[0].includes('vimeo.com')) {
            const videoId = match[1];
            processedContent.push(
              <div key={`video-${i}`} className="my-3">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
                  <iframe
                    src={`https://player.vimeo.com/video/${videoId}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Vimeo video"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          }
          // Direct video file URLs
          else {
            processedContent.push(
              <div key={`video-${i}`} className="my-3">
                <div className="rounded-lg overflow-hidden bg-gray-800">
                  <video
                    src={originalUrl}
                    controls
                    className="w-full h-auto max-h-96 object-cover"
                    preload="metadata"
                  />
                </div>
              </div>
            );
          }
          
          // Finally add text after URL
          if (textAfter.trim()) {
            processedContent.push(
              <p key={`text-after-${i}`} className="text-white text-[15px] leading-5">
                {textAfter.trim()}
              </p>
            );
          }
          break;
        }
      }
      
      // If no video found, render as regular text
      if (!hasVideo && line.trim()) {
        processedContent.push(
          <p key={`text-${i}`} className="text-white text-[15px] leading-5">
            {line}
          </p>
        );
      }
    }

    return processedContent.length > 0 ? processedContent : (
      <p className="text-white text-[15px] leading-5">{content}</p>
    );
  };

  // Component for internal video embeds with thumbnail and navigation
  const InternalVideoEmbed: React.FC<{ 
    videoId: string; 
    originalUrl: string; 
    type: 'video' | 'premium' | 'moment' 
  }> = ({ videoId, originalUrl, type }) => {
    const [videoData, setVideoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchVideoData = async () => {
        try {
          const { data, error } = await supabase
            .from('videos')
            .select(`
              id, title, thumbnail_url, duration, views, likes, 
              is_premium, is_moment,
              profiles:owner_id (username, avatar_url, full_name)
            `)
            .eq('id', videoId)
            .single();

          if (!error && data) {
            setVideoData(data);
          }
        } catch (error) {
          console.error('Error fetching video data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchVideoData();
    }, [videoId]);

    const handleVideoClick = () => {
      if (type === 'premium') {
        navigate(`/premium/video/${videoId}`);
      } else if (type === 'moment') {
        navigate(`/moments?start=${videoId}`);
      } else {
        navigate(`/video/${videoId}`);
      }
    };

    if (loading) {
      return (
        <div className="my-3">
          <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="aspect-video bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      );
    }

    if (!videoData) {
      return (
        <div className="my-3">
          <div className="bg-gray-800 rounded-lg p-4">
            <a 
              href={originalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 break-all"
            >
              {originalUrl}
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="my-3">
        <div 
          className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors border border-gray-700"
          onClick={handleVideoClick}
        >
          {/* Video Thumbnail */}
          <div className="relative aspect-video bg-gray-800">
            <img
              src={videoData.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
              alt={videoData.title}
              className="w-full h-full object-cover"
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
            
            {/* Duration */}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {videoData.duration || '0:00'}
            </div>
            
            {/* Video Type Badges */}
            {type === 'premium' && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
            )}
            
            {type === 'moment' && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold">
                  Moment
                </Badge>
              </div>
            )}
          </div>
          
          {/* Video Info */}
          <div className="p-3">
            <h3 className="text-white font-medium line-clamp-2 mb-2">{videoData.title}</h3>
            
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                {videoData.profiles?.avatar_url && (
                  <img 
                    src={videoData.profiles.avatar_url} 
                    alt={videoData.profiles.username}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span>{videoData.profiles?.full_name || videoData.profiles?.username || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {(videoData.views || 0).toLocaleString()}
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {videoData.likes || 0}
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-purple-400">
              Click to watch • {type === 'premium' ? 'Premium Video' : type === 'moment' ? 'Moment' : 'Video'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchCurrentUserUsername = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        setCurrentUserUsername(data?.username || null);
      }
    };
    fetchCurrentUserUsername();
  }, [user?.id]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username && !user?.id) return;

      try {
        let profileData;
        let targetUserId = user?.id;

        if (username && !isOwnProfile) {
          // Fetch other user's profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

          if (error || !data) {
            console.error('Profile not found:', error);
            setLoading(false);
            return;
          }
          profileData = data;
          targetUserId = data.id;
        } else if (user?.id) {
          // Fetch own profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profileData = data;
        }

        if (profileData && targetUserId) {
          setProfile(profileData);
          setLoading(false); // Set loading to false after profile is loaded

          // Fetch critical data first (subscriber count and subscription status)
          try {
            const [subscriberCount, isSubscribedResult] = await Promise.all([
              getSubscriberCount(targetUserId),
              targetUserId !== user?.id && user?.id ? isSubscribedToCreator(targetUserId) : false,
            ]);

            setSubscriberCount(subscriberCount);
            setIsSubscribed(isSubscribedResult);
          } catch (error) {
            console.error('Error fetching critical data:', error);
          }

          // Fetch non-critical data in background
          setTimeout(async () => {
            try {
              const [posts, stats, favorites, watchHistory] = await Promise.all([
                getCreatorPosts(targetUserId),
                getUserStats(targetUserId),
                getUserFavorites(targetUserId),
                getUserWatchHistory(targetUserId)
              ]);

              setPosts(posts);
              setStats(stats);
              setFavorites(favorites);
              setWatchHistory(watchHistory);

              // Fetch videos if user is a creator
              if (profileData.user_type === 'individual_creator' || profileData.user_type === 'studio_creator') {
                const { data: videos } = await supabase
                  .from('videos')
                  .select('*')
                  .eq('owner_id', targetUserId)
                  .order('created_at', { ascending: false })
                  .limit(50); // Load more videos for pagination

                setUploadedVideos(videos || []);

                // Fetch playlists
                const { data: playlistsData } = await supabase
                  .from('playlists')
                  .select('*')
                  .eq('creator_id', targetUserId)
                  .order('created_at', { ascending: false })
                  .limit(10); // Limit initial load

                setPlaylists(playlistsData || []);
              }
            } catch (fetchError) {
              console.error('Error fetching additional data:', fetchError);
            }
          }, 100); // Small delay to let UI render first
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, user?.id, isOwnProfile]);

  const handleSubscribe = async () => {
    if (!profile || !user?.id) return;

    try {
      if (isSubscribed) {
        const success = await unsubscribeFromCreator(profile.id);
        if (success) {
          setIsSubscribed(false);
          setSubscriberCount(prev => prev - 1);
        }
      } else {
        const success = await subscribeToCreator(profile.id);
        if (success) {
          setIsSubscribed(true);
          setSubscriberCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id && isOwnProfile) {
      try {
        const uploadResult = await uploadCoverPhoto(file, user.id);
        if (uploadResult.success && uploadResult.url) {
          const { error } = await supabase
            .from('profiles')
            .update({ cover_photo_url: uploadResult.url })
            .eq('id', user.id);

          if (!error) {
            setProfile(prev => prev ? { ...prev, cover_photo_url: uploadResult.url } : null);
          }
        }
      } catch (error) {
        console.error('Error uploading cover photo:', error);
      }
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id && isOwnProfile) {
      try {
        const uploadResult = await uploadProfilePicture(file, user.id);
        if (uploadResult.success && uploadResult.url) {
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: uploadResult.url })
            .eq('id', user.id);

          if (!error) {
            setProfile(prev => prev ? { ...prev, avatar_url: uploadResult.url } : null);
          }
        }
      } catch (error) {
        console.error('Error uploading profile photo:', error);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostMedia) return;

    setIsPostingLoading(true);
    try {
      const post = await createPost({
        content: newPostContent,
        media_file: newPostMedia,
        privacy: newPostPrivacy
      });

      if (post) {
        // Update the posts in the feed tab
        setPosts([post, ...posts]);
        // Reset form
        setNewPostContent('');
        setNewPostMedia(null);
        setNewPostPrivacy('public');
        setIsPostModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPostingLoading(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content || '');
    setEditPostPrivacy(post.privacy || 'public');
    setIsEditPostModalOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editPostContent.trim()) return;

    setIsEditingLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editPostContent,
          privacy: editPostPrivacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);

      if (!error) {
        // Update the posts list
        setPosts(posts.map(post => 
          post.id === editingPost.id 
            ? { ...post, content: editPostContent, privacy: editPostPrivacy }
            : post
        ));
        // Reset form
        setEditingPost(null);
        setEditPostContent('');
        setEditPostPrivacy('public');
        setIsEditPostModalOpen(false);
      } else {
        console.error('Error updating post:', error);
      }
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsEditingLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (!error) {
        // Remove the post from the list
        setPosts(posts.filter(post => post.id !== postId));
      } else {
        console.error('Error deleting post:', error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !profile) return;

    setIsSavingProfile(true);
    try {
      const updates = {
        full_name: editDisplayName,
        bio: editBio,
        tip_paypal: editTipPaypal,
        tip_venmo: editTipVenmo,
        tip_cashapp: editTipCashapp,
        tip_bitcoin: editTipBitcoin,
        tip_ethereum: editTipEthereum,
        tip_description: editTipDescription,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { 
          ...prev, 
          full_name: editDisplayName, 
          bio: editBio,
          tip_paypal: editTipPaypal,
          tip_venmo: editTipVenmo,
          tip_cashapp: editTipCashapp,
          tip_bitcoin: editTipBitcoin,
          tip_ethereum: editTipEthereum,
          tip_description: editTipDescription,
        } : null);
        setIsEditingProfile(false);
      } else {
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Initialize edit form when opening
  const handleEditProfile = () => {
    setEditDisplayName(profile?.full_name || '');
    setEditBio(profile?.bio || '');
    setEditTipPaypal(profile.tip_paypal || '');
    setEditTipVenmo(profile.tip_venmo || '');
    setEditTipCashapp(profile.tip_cashapp || '');
    setEditTipBitcoin(profile.tip_bitcoin || '');
    setEditTipEthereum(profile.tip_ethereum || '');
    setEditTipDescription(profile.tip_description || 'Support my content creation journey! 💖');
    setIsEditingProfile(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!username && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />

      {/* Cover Photo with overlaid action buttons */}
      <div className="relative h-32 bg-gradient-to-r from-purple-600 to-blue-600">
        {profile.cover_photo_url ? (
          <img
            src={profile.cover_photo_url}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-600/30 to-blue-600/30" />
        )}

        {/* Header overlay with back button and action icons - moved up */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
          <div className="flex items-center justify-between p-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-md rounded-full w-11 h-11 shadow-lg"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 backdrop-blur-md rounded-full w-11 h-11 shadow-lg"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-yellow-500/20 backdrop-blur-md rounded-full w-11 h-11 shadow-lg border border-yellow-500/30"
                onClick={() => setIsTipModalOpen(true)}
                data-testid="button-tip"
              >
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 backdrop-blur-md rounded-full w-11 h-11 shadow-lg"
                data-testid="button-more"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cover photo upload button for own profile - moved down */}
        {isOwnProfile && (
          <div className="absolute bottom-4 right-4 z-10">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              id="cover-upload"
            />
            <label htmlFor="cover-upload">
              <Button
                size="sm"
                className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md rounded-full w-10 h-10 p-0 shadow-lg"
                asChild
                data-testid="button-cover-upload"
              >
                <span className="cursor-pointer">
                  <Camera className="h-4 w-4" />
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6 space-y-4 bg-gray-950">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-gray-950 -mt-8">
              <AvatarImage 
                src={profile.avatar_url || ''} 
                alt={profile.full_name}
              />
              <AvatarFallback className="bg-gray-800 text-white text-xl">
                {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {profile.verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label htmlFor="profile-upload">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full w-6 h-6 p-0 bg-gray-800 hover:bg-gray-700"
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="h-3 w-3" />
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>

          <div className="flex-1">
            {/* Name and verification */}
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">
                {profile.full_name || profile.username}
              </h1>
              {profile.verified && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>

            {/* Username */}
            <p className="text-gray-400">@{profile.username}</p>

            {/* User type badges */}
            <div className="flex items-center space-x-2 mt-1">
              {profile.user_type === 'individual_creator' && (
                <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                  Creator
                </Badge>
              )}
              {profile.user_type === 'studio_creator' && (
                <Badge variant="secondary" className="bg-orange-600 text-white text-xs">
                  Studio
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-3">
          <p className="text-white leading-relaxed">
            {profile.bio || 'Welcome to my profile! 🌟'}
          </p>

          {/* Social Stats */}
          <div className="flex items-center space-x-6 text-white">
            <div className="flex items-center space-x-1">
              <span className="font-bold">{followingCount}</span>
              <span className="text-gray-400">Following</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-bold">{subscriberCount}</span>
              <span className="text-gray-400">Followers</span>
            </div>
          </div>

          {/* Followers you know (if any) */}
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <div className="flex -space-x-2">
              {/* Placeholder for follower avatars */}
              <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-900"></div>
              <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-900"></div>
            </div>
            <span>2 followers you know</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile ? (
          <div className="flex space-x-3">
            <Button
              onClick={handleSubscribe}
              className={`flex-1 rounded-full font-semibold ${
                isSubscribed 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Button>

            <MessageButton 
              creatorId={profile.id}
              creatorName={profile.username}
              variant="outline"
              className="flex-1 rounded-full font-semibold border-gray-600 text-white hover:bg-gray-800"
            />
          </div>
        ) : (
          <div className="flex space-x-3">
            <Button 
              onClick={handleEditProfile}
              variant="outline"
              className="flex-1 rounded-full font-semibold border-gray-600 text-white hover:bg-gray-800"
              data-testid="button-edit-profile"
            >
              Edit profile
            </Button>
            <Button 
              onClick={() => setIsShareModalOpen(true)}
              variant="outline" 
              className="flex-1 rounded-full font-semibold border-gray-600 text-white hover:bg-gray-800"
              data-testid="button-share-profile"
            >
              Share profile  
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-gray-950 border-b border-gray-800 rounded-none h-auto p-0">
          <TabsTrigger 
            value="videos" 
            className="flex-1 bg-transparent text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none py-4 font-medium"
          >
            Video
          </TabsTrigger>
          <TabsTrigger 
            value="collection" 
            className="flex-1 bg-transparent text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none py-4 font-medium"
          >
            Feed
          </TabsTrigger>
          <TabsTrigger 
            value="likes" 
            className="flex-1 bg-transparent text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none py-4 font-medium"
          >
            Favorite
          </TabsTrigger>
          <TabsTrigger 
            value="playlists" 
            className="flex-1 bg-transparent text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none py-4 font-medium"
          >
            Playlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          <div className="p-4">
            {uploadedVideos.length > 0 ? (
              <div className="space-y-8">
                {/* Moments Section - Horizontal Scrollable */}
                {uploadedVideos.filter(video => video.is_moment).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Play className="w-5 h-5 text-pink-500" />
                        <h3 className="text-lg font-semibold text-white">Moments</h3>
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">Short Videos</Badge>
                      </div>
                      <Link to={`/moments/${profile.username}`}>
                        <Button variant="outline" size="sm" className="text-pink-400 border-pink-400 hover:bg-pink-400 hover:text-white">
                          View All
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Horizontal scrollable moments */}
                    <div className="relative">
                      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                        {uploadedVideos.filter(video => video.is_moment).slice(0, 10).map((video) => (
                          <Link
                            key={`moment-${video.id}`}
                            to={`/moments?start=${video.id}`}
                            className="flex-shrink-0 w-32 group"
                          >
                            <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-800">
                              <img
                                src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=400&fit=crop'}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              
                              {/* Play overlay */}
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                                </div>
                              </div>

                              {/* Duration */}
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {video.duration || '0:15'}
                              </div>

                              {/* Moments badge */}
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs">
                                  Moment
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <h4 className="text-white text-xs font-medium line-clamp-2 leading-tight">
                                {video.title}
                              </h4>
                              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                                <span>{video.views || 0} views</span>
                                <span>{video.likes || 0} ♥</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Gradient fade on right edge */}
                      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                )}

                {/* Premium Videos Section */}
                {uploadedVideos.filter(video => video.is_premium && !video.is_moment).length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-white">Premium Videos</h3>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Premium</Badge>
                    </div>
                    <OptimizedVideoGrid 
                      videos={uploadedVideos
                        .filter(video => video.is_premium && !video.is_moment)
                        .slice(0, showMorePremiumVideos ? 40 : 20)
                        .map(video => ({
                          id: video.id,
                          title: video.title,
                          description: video.description,
                          thumbnail_url: video.thumbnail_url,
                          preview_url: video.preview_url,
                          video_url: video.video_url,
                          duration: video.duration || '0:00',
                          views: video.views || 0,
                          likes: video.likes || 0,
                          tags: video.tags || [],
                          created_at: video.created_at,
                          is_premium: video.is_premium,
                          uploader_username: profile.username,
                          uploader_name: profile.full_name || profile.username,
                          uploader_avatar: profile.avatar_url,
                          uploader_type: profile.user_type as any,
                          uploader_id: profile.id,
                          owner_id: video.owner_id
                        }))}
                      viewMode="grid"
                      showAds={false}
                      showMoments={false}
                      showPremiumSection={false}
                      showTags={true}
                      showDate={false}
                    />
                    {uploadedVideos.filter(video => video.is_premium && !video.is_moment).length > 20 && (
                      <div className="flex justify-center mt-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-purple-500 border-purple-500 hover:bg-purple-500 hover:text-white"
                          onClick={() => setShowMorePremiumVideos(!showMorePremiumVideos)}
                          data-testid="button-toggle-premium-videos"
                        >
                          {showMorePremiumVideos ? 'Show Less' : 'Show More'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Regular Videos Section */}
                {uploadedVideos.filter(video => !video.is_premium && !video.is_moment).length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Play className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-white">Regular Videos</h3>
                      <Badge variant="secondary" className="bg-gray-700 text-white">Free</Badge>
                    </div>
                    <OptimizedVideoGrid 
                      videos={uploadedVideos
                        .filter(video => !video.is_premium && !video.is_moment)
                        .slice(0, showMoreVideos ? 40 : 20)
                        .map(video => ({
                          id: video.id,
                          title: video.title,
                          description: video.description,
                          thumbnail_url: video.thumbnail_url,
                          preview_url: video.preview_url,
                          video_url: video.video_url,
                          duration: video.duration || '0:00',
                          views: video.views || 0,
                          likes: video.likes || 0,
                          tags: video.tags || [],
                          created_at: video.created_at,
                          is_premium: video.is_premium,
                          uploader_username: profile.username,
                          uploader_name: profile.full_name || profile.username,
                          uploader_avatar: profile.avatar_url,
                          uploader_type: profile.user_type as any,
                          uploader_id: profile.id,
                          owner_id: video.owner_id
                        }))}
                      viewMode="grid"
                      showAds={false}
                      showMoments={false}
                      showPremiumSection={false}
                      showTags={true}
                      showDate={false}
                    />
                    {uploadedVideos.filter(video => !video.is_premium && !video.is_moment).length > 20 && (
                      <div className="flex justify-center mt-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-purple-500 border-purple-500 hover:bg-purple-500 hover:text-white"
                          onClick={() => setShowMoreVideos(!showMoreVideos)}
                          data-testid="button-toggle-regular-videos"
                        >
                          {showMoreVideos ? 'Show Less' : 'Show More'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Play className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No videos uploaded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="collection" className="mt-0">
          <div>
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => (
                  <article key={post.id} className="border-b border-gray-800 p-4 hover:bg-gray-950/50 transition-colors">
                    <div className="flex space-x-3">
                      <Avatar className="h-12 w-12 hover:ring-2 hover:ring-blue-500 transition-all">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {(profile.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 hover:underline min-w-0">
                              <span className="font-bold text-white text-[15px] truncate">
                                @{profile.username}
                              </span>
                              {profile.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            </div>
                            <span className="text-gray-500 text-sm flex-shrink-0">
                              · {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
                            </span>
                          </div>
                          {isOwnProfile && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-800 hover:text-white p-1 flex-shrink-0" data-testid="button-post-menu">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-sm">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Post Options</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2">
                                  <Button 
                                    variant="ghost" 
                                    className="w-full justify-start text-white hover:bg-gray-800" 
                                    onClick={() => handleEditPost(post)}
                                    data-testid={`button-edit-post-${post.id}`}
                                  >
                                    Edit Post
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    className="w-full justify-start text-red-400 hover:bg-gray-800" 
                                    onClick={() => handleDeletePost(post.id)}
                                    data-testid={`button-delete-post-${post.id}`}
                                  >
                                    Delete Post
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                        <div className="mb-3">
                          <div className="text-white text-[15px] leading-5" data-testid={`post-content-${post.id}`}>{renderPostContent(post.content)}</div>

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
                            className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full group"
                          >
                            <Heart className="h-[18px] w-[18px] mr-1" />
                            <span className="text-sm">{post.likes_count || ''}</span>
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 p-2 rounded-full group"
                          >
                            <Share className="h-[18px] w-[18px]" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 p-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No posts yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-4">
            {favorites.length > 0 ? (
              <OptimizedVideoGrid 
                videos={favorites.map(video => ({
                  id: video.id,
                  title: video.title,
                  description: video.description,
                  thumbnail_url: video.thumbnail_url,
                  preview_url: video.preview_url,
                  video_url: video.video_url,
                  duration: video.duration || '0:00',
                  views: video.views || 0,
                  likes: video.likes || 0,
                  tags: video.tags || [],
                  created_at: video.created_at,
                  is_premium: video.is_premium,
                  uploader_username: video.uploader_username,
                  uploader_name: video.uploader_name,
                  uploader_avatar: video.uploader_avatar,
                  uploader_type: video.uploader_type as any,
                  uploader_id: video.uploader_id,
                  owner_id: video.owner_id
                }))}
                viewMode="grid"
                showAds={false}
                showMoments={false}
                showPremiumSection={false}
                showTags={true}
                showDate={false}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No favorite videos yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="playlists" className="mt-0">
          <div className="p-4">
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="relative aspect-video bg-gray-700">
                      <img
                        src={playlist.thumbnail_url || '/placeholder-thumbnail.jpg'}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1 text-white text-xs">
                        {playlist.video_count || 0} videos
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-medium text-sm truncate">{playlist.name}</h3>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{playlist.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No playlists yet
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>


      {/* Floating Post Button - Only for own profile and only on Feed tab */}
      {isOwnProfile && (profile.user_type === 'individual_creator' || profile.user_type === 'studio_creator') && activeTab === 'collection' && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setIsPostModalOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            data-testid="floating-post-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      )}

      {/* Post Creation Modal */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {(profile.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's happening?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[120px] bg-transparent border-gray-700 resize-none text-base placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
                  data-testid="textarea-post-content"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setNewPostMedia(e.target.files?.[0] || null)}
                      className="hidden"
                      id="post-media-upload"
                    />
                    <label htmlFor="post-media-upload">
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-500/10 p-2" asChild data-testid="button-upload-media">
                        <span className="cursor-pointer">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      </Button>
                    </label>

                    <Select value={newPostPrivacy} onValueChange={setNewPostPrivacy}>
                      <SelectTrigger className="w-auto border-gray-700 bg-transparent text-blue-500">
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
                    data-testid="button-create-post"
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
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog open={isEditPostModalOpen} onOpenChange={setIsEditPostModalOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {(profile.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's happening?"
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  className="min-h-[120px] bg-transparent border-gray-700 resize-none text-base placeholder-gray-500 focus:ring-1 focus:ring-purple-500"
                  data-testid="textarea-edit-post-content"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Select value={editPostPrivacy} onValueChange={setEditPostPrivacy}>
                      <SelectTrigger className="w-auto border-gray-700 bg-transparent text-purple-500">
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

                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setIsEditPostModalOpen(false)}
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                      data-testid="button-cancel-edit-post"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdatePost}
                      disabled={isEditingLoading || !editPostContent.trim()}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-1.5 rounded-full disabled:opacity-50"
                      data-testid="button-update-post"
                    >
                      {isEditingLoading ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="bg-black/70 backdrop-blur-xl border border-gray-700/30 text-white max-w-md shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-700/30 flex-shrink-0">
            <DialogTitle className="text-white text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-200 tracking-wide">
                Display Name
              </label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg h-12"
                data-testid="input-display-name"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-200 tracking-wide">
                Bio
              </label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell people about yourself..."
                className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg min-h-[100px] resize-none"
                data-testid="textarea-bio"
              />
            </div>

            {/* Tip Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Tip Settings</h3>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 tracking-wide">
                  PayPal
                </label>
                <Input
                  value={editTipPaypal}
                  onChange={(e) => setEditTipPaypal(e.target.value)}
                  placeholder="Your PayPal email or link"
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg h-11"
                  data-testid="input-tip-paypal"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 tracking-wide">
                  Venmo
                </label>
                <Input
                  value={editTipVenmo}
                  onChange={(e) => setEditTipVenmo(e.target.value)}
                  placeholder="Your Venmo username or link"
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg h-11"
                  data-testid="input-tip-venmo"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 tracking-wide">
                  Cash App
                </label>
                <Input
                  value={editTipCashapp}
                  onChange={(e) => setEditTipCashapp(e.target.value)}
                  placeholder="Your Cash App username or link"
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg h-11"
                  data-testid="input-tip-cashapp"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 tracking-wide">
                  Bitcoin
                </label>
                <Input
                  value={editTipBitcoin}
                  onChange={(e) => setEditTipBitcoin(e.target.value)}
                  placeholder="Your Bitcoin address"
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg h-11"
                  data-testid="input-tip-bitcoin"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 tracking-wide">
                  Ethereum
                </label>
                <Input
                  value={editTipEthereum}
                  onChange={(e) => setEditTipEthereum(e.target.value)}
                  placeholder="Your Ethereum address"
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg h-11"
                  data-testid="input-tip-ethereum"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 tracking-wide">
                  Tip Message
                </label>
                <Textarea
                  value={editTipDescription}
                  onChange={(e) => setEditTipDescription(e.target.value)}
                  placeholder="Support my content creation journey! 💖"
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200 rounded-lg min-h-[70px] resize-none"
                  data-testid="textarea-tip-description"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6 border-t border-gray-700/30 flex-shrink-0">
            <Button
              onClick={() => setIsEditingProfile(false)}
              variant="outline"
              className="flex-1 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50 backdrop-blur-sm transition-all duration-200 rounded-lg h-12 font-medium"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200 rounded-lg h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-save-profile"
            >
              {isSavingProfile ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Profile Modal */}
      <ShareModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        videoTitle={`${profile.full_name || profile.username}'s Profile`}
        videoId=""
      >
        <div />
      </ShareModal>

      {/* Tip Modal */}
      {isTipModalOpen && (
        <TipModal
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          creatorName={profile.username}
          creatorId={profile.id}
        />
      )}
    </div>
  );
};

export default ProfilePage;