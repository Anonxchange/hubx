import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getUserFavorites, getUserWatchHistory, UserStats } from '@/services/userStatsService';
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
  Play
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VerificationBadge from '@/components/VerificationBadge';
import VideoUploadForm from '@/components/admin/VideoUploadForm';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { user, userType, loading } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !username || username === user?.email?.split('@')[0];
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

  // Fetch user statistics
  useEffect(() => {
    const fetchUserData = async () => {
      // Handle cases where user might not be logged in or profile is public
      const userId = user?.id || null; // Use null if user is not logged in
      if (!userId && username) {
        // If viewing a public profile, we need to fetch user ID based on username
        try {
          const { data, error } = await supabase
            .from('users') // Assuming you have a 'users' table to map usernames to IDs
            .select('id')
            .eq('username', username) // Assuming 'username' is a unique field
            .single();

          if (error || !data) {
            console.error('Error fetching user ID for public profile:', error);
            // Handle error, maybe navigate to a not found page
            return;
          }
          // userId = data.id; // Set userId for public profile fetch
          // For now, we'll assume public profiles don't have stats fetched this way,
          // or you'd need a separate public profile service.
          // This current implementation is primarily for the logged-in user's profile.
        } catch (error) {
          console.error('Error fetching user ID for public profile:', error);
          return;
        }
      }

      // Only fetch if we have a user ID (either logged in user or found public user ID)
      if (!userId) return;

      setStatsLoading(true);
      try {
        const promises = [
          getUserStats(userId),
          getUserFavorites(userId),
          getUserWatchHistory(userId)
        ];

        // If user is a creator, also fetch their uploaded videos
        if (userType === 'individual_creator' || userType === 'studio_creator') {
          promises.push(
            supabase
              .from('videos')
              .select('*')
              .eq('owner_id', userId)
              .order('created_at', { ascending: false })
          );
        }

        const results = await Promise.all(promises);
        const [userStats, userFavorites, userWatchHistory, uploadsResponse] = results;

        setStats(userStats);
        setFavorites(userFavorites);
        setWatchHistory(userWatchHistory);

        if (uploadsResponse && !uploadsResponse.error) {
          setUploadedVideos(uploadsResponse.data || []);
        } else if (uploadsResponse && uploadsResponse.error) {
          console.error('Error fetching uploaded videos:', uploadsResponse.error);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id, userType, username]); // Added dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If viewing own profile and not logged in, redirect to auth
  if (!username && !user) return <Navigate to="/auth" replace />;

  // If viewing someone else's profile, allow public access
  if (username && !isOwnProfile) {
    // This part would typically render a public view of another user's profile.
    // The current logic in fetchUserData needs to be adapted to handle fetching
    // data based on the 'username' param if it's not the current user's profile.
    // For now, we'll assume the main data fetching is for the logged-in user.
    // You might want to fetch public profile data here if needed.
  }

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

  const getUserTypeInfo = () => {
    switch (userType) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-5xl mx-auto">
        {/* Cover Photo - Twitter style */}
        <div className="relative">
          <div
            className="w-full h-32 sm:h-40 bg-gradient-to-br from-gray-800 via-gray-700 to-black relative overflow-hidden"
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
        </div>

        {/* Profile Picture - Positioned over cover */}
        <div className="absolute -bottom-12 left-4 sm:left-6">
          <div className="relative">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 border-4 border-background shadow-xl">
              <AvatarImage src={profilePhoto || user?.user_metadata?.avatar_url} className="object-cover" />
              <AvatarFallback className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-orange-500 to-red-600 text-white">
                {currentUsername.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {isOwnProfile && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg bg-orange-500 hover:bg-orange-600 border-2 border-background"
                  >
                    <Camera className="w-4 h-4" />
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
      <div className="px-4 sm:px-6 pt-16 pb-6 border-b border-gray-800 bg-background">

      {/* Profile Info Section */}
      <div className="px-4 sm:px-6 pt-16 pb-6 border-b border-gray-800 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {displayedName}
              </h1>
              {(userType === 'individual_creator' || userType === 'studio_creator') && (
                <VerificationBadge
                  userType={userType}
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
                <span className="font-bold text-white">{stats.subscribers}</span>
                <span className="text-gray-400 ml-1">Subscribers</span>
              </div>
              {(userType === 'individual_creator' || userType === 'studio_creator') && (
                <div className="text-sm">
                  <span className="font-bold text-white">{stats.uploadedVideos}</span>
                  <span className="text-gray-400 ml-1">Videos</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Twitter style positioning */}
          <div className="flex space-x-2 mt-auto">
            {/* Tip Button - Always visible */}
            <Button
              variant="outline"
              className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Tip
            </Button>

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
                <DialogContent className="max-w-md bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
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
                    <Button onClick={() => setIsEditing(false)} className="w-full bg-orange-500 hover:bg-orange-600">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="mt-6 px-4 sm:px-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-lg font-semibold text-white">About {displayedName}</h3>
              {(userType === 'individual_creator' || userType === 'studio_creator') && (
                <VerificationBadge
                  userType={userType}
                  showText={false}
                />
              )}
            </div>
            <p className="text-gray-300 mb-4">{bio}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {joinDate}</span>
              </div>
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
                    Website
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section - Detailed Cards */}
      <div className="mt-6 px-4 sm:px-6">
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(userType === 'user' ? 4 : 6)].map((_, i) => (
              <Card key={i} className="p-4 bg-gray-900 border-gray-800">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : userType === 'user' ? (
          /* Regular User Stats */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-lg text-white">{stats.videosWatched}</span>
              </div>
              <p className="text-sm text-gray-400">Videos Watched</p>
            </Card>

            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="font-bold text-lg text-white">{stats.favoritesCount}</span>
              </div>
              <p className="text-sm text-gray-400">Favorites</p>
            </Card>

            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Play className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-lg text-white">{Math.floor(stats.watchTimeMinutes / 60)}h {stats.watchTimeMinutes % 60}m</span>
              </div>
              <p className="text-sm text-gray-400">Watch Time</p>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-orange-900/50 to-purple-900/50 border-orange-600 hover:from-orange-800/50 hover:to-purple-800/50 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Video className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-lg text-white">{stats.uploadedVideos}</span>
              </div>
              <p className="text-sm text-gray-400">Uploads</p>
              <p className="text-xs text-orange-400 mt-1">Become a creator!</p>
            </Card>
          </div>
        ) : (
          /* Creator Stats */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Video className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-lg text-white">{stats.uploadedVideos}</span>
              </div>
              <p className="text-sm text-gray-400">Videos</p>
            </Card>

            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="font-bold text-lg text-white">{stats.subscribers}</span>
              </div>
              <p className="text-sm text-gray-400">Subscribers</p>
            </Card>

            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Play className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-lg text-white">{stats.totalViews.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-400">Total Views</p>
            </Card>

            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="font-bold text-lg text-white">{stats.favoritesCount}</span>
              </div>
              <p className="text-sm text-gray-400">Likes</p>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-600 hover:from-green-800/50 hover:to-emerald-800/50 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="font-bold text-lg text-white">${stats.earnings}</span>
              </div>
              <p className="text-sm text-gray-400">Earnings</p>
            </Card>

            <Card className="p-4 text-center bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-lg text-white">{stats.videosWatched}</span>
              </div>
              <p className="text-sm text-gray-400">Watched</p>
            </Card>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="mt-8 px-4 sm:px-6">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className={`grid w-full ${userType === 'user' ? 'grid-cols-4' : 'grid-cols-4'} bg-gray-800 border-gray-700`}>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">Videos</TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">Photos</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">Stream</TabsTrigger>
            {userType === 'user' ? (
              <TabsTrigger value="upgrade" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">More</TabsTrigger>
            ) : (
              <TabsTrigger value="uploads" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">More</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                    {favorites.slice(0, 12).map((video) => (
                      <div
                        key={video.id}
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
                            <Heart className="w-3 h-3" />
                            <span>{video.likes?.toLocaleString() || 0}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">Favs Videos (1)</h3>
                    <p className="text-gray-400">
                      Videos you like will appear here. Start exploring to build your collection!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
            <Card>
              <CardContent className="p-6">
                {watchHistory.length > 0 ? (
                  <div className="space-y-4">
                    {watchHistory.slice(0, 20).map((video) => (
                      <div key={`${video.id}-${video.watched_at}`} className="flex items-center space-x-4 group cursor-pointer hover:bg-muted/50 p-3 rounded-lg">
                        <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {video.thumbnail_url && (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-2 mb-1">{video.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{video.views?.toLocaleString() || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{video.likes?.toLocaleString() || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Watched {new Date(video.watched_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No viewing history</h3>
                    <p className="text-muted-foreground">
                      Your recently watched videos will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userType !== 'user' && (
            <TabsContent value="uploads" className="mt-6">
              <div className="space-y-6">
                {/* Upload Form Section */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Upload className="w-5 h-5 text-orange-500" />
                      <span>Upload New Content</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VideoUploadForm onVideoAdded={() => window.location.reload()} />
                  </CardContent>
                </Card>

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

      <Footer />
    </div>
  );
};

export default ProfilePage;