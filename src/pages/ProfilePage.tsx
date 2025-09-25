import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Bell, DollarSign, MoreHorizontal, MessageCircle, UserPlus, CheckCircle, Camera, Play, List, Heart, Upload, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  subscribeToCreator, 
  unsubscribeFromCreator, 
  isSubscribedToCreator, 
  getSubscriberCount,
  getCreatorPosts,
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

  // Determine if viewing own profile
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const isOwnProfile = !username || (currentUserUsername && username === currentUserUsername);

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

          // Fetch additional data with proper typing
          try {
            const [
              subscriberCount,
              isSubscribedResult,
              posts,
              stats,
              favorites,
              watchHistory
            ] = await Promise.all([
              getSubscriberCount(targetUserId),
              targetUserId !== user?.id && user?.id ? isSubscribedToCreator(targetUserId) : false,
              getCreatorPosts(targetUserId),
              getUserStats(targetUserId),
              getUserFavorites(targetUserId),
              getUserWatchHistory(targetUserId)
            ]);

            setSubscriberCount(subscriberCount);
            setIsSubscribed(isSubscribedResult);
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
                .order('created_at', { ascending: false });

              setUploadedVideos(videos || []);
            }

            // Fetch playlists if user is a creator
            if (profileData.user_type === 'individual_creator' || profileData.user_type === 'studio_creator') {
              const { data: playlistsData } = await supabase
                .from('playlists')
                .select('*')
                .eq('creator_id', targetUserId)
                .order('created_at', { ascending: false });
              
              setPlaylists(playlistsData || []);
            }
          } catch (fetchError) {
            console.error('Error fetching additional data:', fetchError);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
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

        {/* Header overlay with back button and action icons */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between p-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 backdrop-blur-sm rounded-full w-10 h-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 backdrop-blur-sm rounded-full w-10 h-10"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 backdrop-blur-sm rounded-full w-10 h-10"
                onClick={() => setIsTipModalOpen(true)}
              >
                <DollarSign className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 backdrop-blur-sm rounded-full w-10 h-10"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cover photo upload button for own profile */}
        {isOwnProfile && (
          <div className="absolute bottom-2 right-2">
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
                className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm rounded-full w-8 h-8 p-0"
                asChild
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
              onClick={() => setIsEditingProfile(true)}
              variant="outline"
              className="flex-1 rounded-full font-semibold border-gray-600 text-white hover:bg-gray-800"
            >
              Edit profile
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 rounded-full font-semibold border-gray-600 text-white hover:bg-gray-800"
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
              <OptimizedVideoGrid 
                videos={uploadedVideos.map(video => ({
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
            ) : (
              <div className="text-center py-8 text-gray-400">
                No videos uploaded yet
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="collection" className="mt-0">
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
                No favorites yet
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-4">
            {posts.length > 0 ? (
              <OptimizedVideoGrid 
                videos={posts.map(post => ({
                  id: post.id,
                  title: post.title,
                  description: post.description,
                  thumbnail_url: post.thumbnail_url,
                  preview_url: post.preview_url,
                  video_url: post.video_url,
                  duration: post.duration || '0:00',
                  views: post.views || 0,
                  likes: post.likes || 0,
                  tags: post.tags || [],
                  created_at: post.created_at,
                  is_premium: post.is_premium,
                  uploader_username: post.uploader_username,
                  uploader_name: post.uploader_name,
                  uploader_avatar: post.uploader_avatar,
                  uploader_type: post.uploader_type as any,
                  uploader_id: post.uploader_id,
                  owner_id: post.owner_id
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
                No posts yet
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