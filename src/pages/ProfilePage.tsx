
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getUserFavorites, getUserWatchHistory, UserStats } from '@/services/userStatsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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

const ProfilePage = () => {
  const { user, userType, loading } = useAuth();
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
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch user statistics
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setStatsLoading(true);
      try {
        const [userStats, userFavorites, userWatchHistory] = await Promise.all([
          getUserStats(user.id),
          getUserFavorites(user.id),
          getUserWatchHistory(user.id)
        ]);
        
        setStats(userStats);
        setFavorites(userFavorites);
        setWatchHistory(userWatchHistory);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cover Photo Section */}
        <div className="relative">
          <div 
            className="h-64 md:h-80 w-full rounded-t-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 relative overflow-hidden"
            style={{
              backgroundImage: coverPhoto ? `url(${coverPhoto})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!coverPhoto && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-pink-500/80 to-orange-500/80" />
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Change Cover
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Cover Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coverPhoto">Upload Cover Photo</Label>
                    <Input
                      id="coverPhoto"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverPhotoChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommended size: 1200x320px. Max file size: 5MB
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Profile Info Section */}
          <Card className="relative -mt-16 mx-4 md:mx-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
                {/* Profile Picture */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={profilePhoto || user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="profilePhoto">Upload Profile Picture</Label>
                          <Input
                            id="profilePhoto"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Recommended size: 400x400px. Max file size: 2MB
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold">
                      {displayName || user.email?.split('@')[0] || 'User'}
                    </h1>
                    <Badge className={`${userTypeInfo.bgColor} ${userTypeInfo.color} border-0`}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {userTypeInfo.label}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground max-w-2xl">{bio}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                        <a href={website} className="hover:text-primary" target="_blank" rel="noopener noreferrer">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Your location"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <Button onClick={() => setIsEditing(false)} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-6">
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(userType === 'user' ? 4 : 6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : userType === 'user' ? (
            /* Regular User Stats */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-lg">{stats.videosWatched}</span>
                </div>
                <p className="text-sm text-muted-foreground">Videos Watched</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-lg">{stats.favoritesCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Play className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-lg">{Math.floor(stats.watchTimeMinutes / 60)}h {stats.watchTimeMinutes % 60}m</span>
                </div>
                <p className="text-sm text-muted-foreground">Watch Time</p>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-950/20 dark:to-purple-950/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Video className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-lg">{stats.uploadedVideos}</span>
                </div>
                <p className="text-sm text-muted-foreground">Uploads</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Become a creator!</p>
              </Card>
            </div>
          ) : (
            /* Creator Stats */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Video className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-lg">{stats.uploadedVideos}</span>
                </div>
                <p className="text-sm text-muted-foreground">Videos</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="font-bold text-lg">{stats.subscribers}</span>
                </div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Play className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-lg">{stats.totalViews.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-lg">{stats.favoritesCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Likes</p>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-lg">${stats.earnings}</span>
                </div>
                <p className="text-sm text-muted-foreground">Earnings</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-lg">{stats.videosWatched}</span>
                </div>
                <p className="text-sm text-muted-foreground">Watched</p>
              </Card>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className={`grid w-full ${userType === 'user' ? 'grid-cols-4' : 'grid-cols-4'}`}>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="watchlist">Watch Later</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              {userType === 'user' ? (
                <TabsTrigger value="upgrade">Become Creator</TabsTrigger>
              ) : (
                <TabsTrigger value="uploads">My Videos</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="favorites" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {favorites.slice(0, 12).map((video) => (
                        <div key={video.id} className="group cursor-pointer">
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
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
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
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
                      <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                      <p className="text-muted-foreground">
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
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {userType === 'individual_creator' 
                          ? "Start creating and sharing your content to build your audience and earn revenue!"
                          : "Upload content for your studio and manage your team's creations!"
                        }
                      </p>
                      <div className="space-y-3">
                        <Button className="w-full max-w-sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Your First Video
                        </Button>
                        {userType === 'studio_creator' && (
                          <div className="flex flex-col space-y-2">
                            <Button variant="outline" className="w-full max-w-sm">
                              <Users className="w-4 h-4 mr-2" />
                              Manage Team Members
                            </Button>
                            <Button variant="outline" className="w-full max-w-sm">
                              <Star className="w-4 h-4 mr-2" />
                              Revenue Analytics
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Creator Benefits Reminder */}
                      <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border max-w-md mx-auto">
                        <h4 className="font-semibold text-sm mb-2 flex items-center">
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
                  </CardContent>
                </Card>
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
