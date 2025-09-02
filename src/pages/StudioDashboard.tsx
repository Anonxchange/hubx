import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Crown, 
  Users, 
  Video, 
  DollarSign, 
  Upload, 
  Settings, 
  BarChart3,
  Play,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Calendar,
  FileText,
  UserPlus,
  ThumbsUp,
  Tv,
  Edit,
  Trash2,
  CreditCard,
  Download
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideo, updateVideo, Video as VideoType } from '@/services/videosService';
import { useToast } from '@/hooks/use-toast';
import VideoEditModal from '@/components/admin/VideoEditModal';
import { getCreatorEarnings, getViewEarnings, getCreatorPayouts, requestPayout, EarningsStats, ViewEarning, Payout } from '@/services/earningsService';

const StudioDashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalEarnings: 0,
    subscribers: 0,
    teamMembers: 0,
    pendingUploads: 0
  });
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [earningsStats, setEarningsStats] = useState<EarningsStats>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    totalTips: 0,
    premiumRevenue: 0,
    viewEarnings: 0,
    totalViews: 0,
    premiumViews: 0
  });
  const [viewEarnings, setViewEarnings] = useState<ViewEarning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'crypto' | 'bank_transfer'>('paypal');
  const [payoutDetails, setPayoutDetails] = useState('');

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
      // Refresh the videos list
      fetchStudioContent();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ videoId, updates }: { videoId: string; updates: Partial<VideoType> }) => 
      updateVideo(videoId, updates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video updated successfully!",
      });
      setEditingVideo(null);
      // Refresh the videos list
      fetchStudioContent();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  const handleDelete = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate(videoId);
    }
  };

  const handleEdit = (video: VideoType) => {
    setEditingVideo(video);
  };

  // Fetch earnings data
  const fetchEarningsData = async () => {
    if (!user?.id) return;
    
    setEarningsLoading(true);
    try {
      // Get creator earnings
      const earnings = await getCreatorEarnings(user.id);
      setEarningsStats(earnings);

      // Get view earnings history
      const viewEarningsData = await getViewEarnings(user.id, 50);
      setViewEarnings(viewEarningsData);

      // Get payout history
      const payoutsData = await getCreatorPayouts(user.id);
      setPayouts(payoutsData);

      // Update stats with earnings data
      setStats(prev => ({
        ...prev,
        totalEarnings: earnings.totalEarnings
      }));
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  // Handle payout request
  const handlePayoutRequest = async () => {
    if (!user?.id) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 10) {
      toast({
        title: "Error",
        description: "Minimum payout amount is $10.00",
        variant: "destructive",
      });
      return;
    }

    if (amount > earningsStats.availableBalance) {
      toast({
        title: "Error",
        description: "Insufficient balance for this payout amount",
        variant: "destructive",
      });
      return;
    }

    let details = {};
    try {
      if (payoutMethod === 'paypal') {
        details = { email: payoutDetails };
      } else if (payoutMethod === 'crypto') {
        details = { wallet_address: payoutDetails, currency: 'BTC' };
      } else if (payoutMethod === 'bank_transfer') {
        details = { routing_number: payoutDetails, account_number: 'hidden' };
      }

      const success = await requestPayout(user.id, amount, payoutMethod, details);
      
      if (success) {
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutDetails('');
        // Refresh earnings data
        await fetchEarningsData();
        toast({
          title: "Success",
          description: "Payout request submitted successfully",
        });
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Error",
        description: "Failed to request payout. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userType !== 'studio_creator') {
    return <Navigate to="/creator-dashboard" replace />;
  }

  const fetchStudioContent = async () => {
    if (!user?.id) return;

    setContentLoading(true);
    try {
      // Fetch uploaded videos
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching studio content:', error);
        return;
      }

      setUploadedVideos(videos || []);

      // Update stats
      const totalViews = videos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        totalVideos: videos?.length || 0,
        totalViews
      }));

      // Also fetch earnings data
      await fetchEarningsData();
    } catch (error) {
      console.error('Error fetching studio content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioContent();
  }, [user?.id]);

  // Function to handle thumbnail upload using Bunny CDN
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, videoId: string) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    
    try {
      // Import the upload function dynamically
      const { uploadToBunnyStorage, generateUniqueFilename } = await import('@/services/bunnyStorageService');
      
      // Generate unique filename for thumbnail
      const filename = generateUniqueFilename(file.name, user?.id || '', 'thumbnails');
      
      // Upload to Bunny CDN
      const uploadResult = await uploadToBunnyStorage(file, filename);
      
      if (uploadResult.success && uploadResult.url) {
        // Update video thumbnail in database
        const { error } = await supabase
          .from('videos')
          .update({ thumbnail_url: uploadResult.url })
          .eq('id', videoId)
          .eq('owner_id', user?.id);

        if (error) {
          console.error('Error updating video thumbnail:', error);
          alert('Failed to update thumbnail in database');
        } else {
          alert('Thumbnail updated successfully!');
          // Refresh the videos list
          window.location.reload();
        }
      } else {
        console.error('Failed to upload thumbnail:', uploadResult.error);
        alert('Failed to upload thumbnail. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Error uploading thumbnail. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Crown className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold">Studio Dashboard</h1>
              <p className="text-gray-400">Manage your studio's content library and performers</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-500 text-white">
              <Tv className="w-3 h-3 mr-1" />
              Studio Creator
            </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Videos</p>
                  <p className="text-2xl font-bold">{stats.totalVideos}</p>
                </div>
                <Video className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold">${earningsStats.totalEarnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Available: ${earningsStats.availableBalance.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Team Members</p>
                  <p className="text-2xl font-bold">{stats.teamMembers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">Overview</TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-orange-500">Earnings</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-orange-500">Content</TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-orange-500">Team</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-500">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-orange-500">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Studio Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Upload className="w-5 h-5 text-green-500" />
                        <span>Studio content uploaded</span>
                      </div>
                      <span className="text-gray-400 text-sm">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                        <span>New performer signed</span>
                      </div>
                      <span className="text-gray-400 text-sm">1 day ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <span>Revenue sharing distributed</span>
                      </div>
                      <span className="text-gray-400 text-sm">3 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Studio Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => navigate('/upload')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Studio Content
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Performers
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Revenue Analytics
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      <Settings className="w-4 h-4 mr-2" />
                      Studio Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="mt-6">
            <div className="space-y-6">
              {/* Earnings Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-green-400">
                      ${earningsStats.availableBalance.toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-400">Available Balance</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-white">
                      ${earningsStats.thisMonth.toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-400">This Month</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-white">
                      ${earningsStats.totalEarnings.toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-400">Total Earned</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-yellow-400">
                      ${earningsStats.pendingPayouts.toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-400">Pending Payouts</p>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings Breakdown */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                      <span className="text-white">View Earnings ({earningsStats.totalViews + earningsStats.premiumViews} views)</span>
                      <span className="font-bold text-green-400">${earningsStats.viewEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                      <span className="text-white">Tips & Donations</span>
                      <span className="font-bold text-green-400">${earningsStats.totalTips.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                      <span className="text-white">Premium Revenue</span>
                      <span className="font-bold text-green-400">${earningsStats.premiumRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payout Section */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Payout Management</CardTitle>
                    <Button 
                      onClick={() => setShowPayoutModal(true)}
                      disabled={earningsStats.availableBalance < 10}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Request Payout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payouts.length > 0 ? (
                      payouts.slice(0, 5).map((payout) => (
                        <div key={payout.id} className="flex justify-between items-center p-4 border border-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-white">${payout.amount.toFixed(2)} via {payout.payout_method}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(payout.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            payout.status === 'completed' ? 'default' : 
                            payout.status === 'pending' ? 'secondary' :
                            payout.status === 'processing' ? 'outline' : 'destructive'
                          }>
                            {payout.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-gray-400">
                        No payout history yet. Minimum payout is $10.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent View Earnings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent View Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {viewEarnings.length > 0 ? (
                      viewEarnings.slice(0, 10).map((earning) => (
                        <div key={earning.id} className="flex justify-between items-center p-3 border border-gray-700 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {(earning as any).videos?.title || 'Video'} 
                              {earning.is_premium && <Badge className="ml-2" variant="secondary">Premium</Badge>}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(earning.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-400">
                              +${earning.earnings_amount.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-400">
                              ${earning.earnings_rate_per_1k.toFixed(2)}/1k views
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-gray-400">
                        No view earnings yet. Upload content and get views to start earning!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Studio Content Library ({stats.totalVideos} videos)</CardTitle>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading studio content...</p>
                  </div>
                ) : uploadedVideos.length > 0 ? (
                  <div className="space-y-4">
                    {uploadedVideos.map((video) => (
                      <div key={video.id} className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                        {/* The 'w-32 aspect-video' style handles the width and aspect ratio for the thumbnail */}
                        <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            // Placeholder if thumbnail is not available
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                            {video.duration || '00:00'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-2 mb-2 text-white">{video.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{video.views?.toLocaleString() || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{video.likes?.toLocaleString() || 0}</span>
                            </span>
                            <span>Uploaded {new Date(video.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {video.tags?.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags?.length > 3 && (
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                +{video.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 text-white hover:bg-gray-800"
                            onClick={() => navigate(`/video/${video.id}`)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 text-white hover:bg-gray-800"
                            onClick={() => handleEdit(video)}
                            disabled={updateMutation.isPending}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          {/* Example of a button to trigger image upload for a video */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 text-white hover:bg-gray-800"
                            onClick={() => {
                              // Trigger a hidden file input for image upload
                              document.getElementById(`thumbnail-upload-${video.id}`)?.click();
                            }}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Update Thumbnail
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(video.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                          {/* Hidden file input for thumbnail upload */}
                          <input
                            type="file"
                            id={`thumbnail-upload-${video.id}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, video.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No content uploaded yet</h3>
                    <p className="text-gray-400 mb-6">Start uploading content to build your studio's library</p>
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => navigate('/upload')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload First Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Performer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manage Your Performers</h3>
                  <p className="text-gray-400 mb-6">Add performers to your studio and manage revenue sharing</p>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Performer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Analytics & Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-400 mb-6">Track your studio's performance and revenue</p>
                  <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Studio Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Studio Configuration</h3>
                  <p className="text-gray-400 mb-6">Manage your studio settings and preferences</p>
                  <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      {/* Video Edit Modal */}
      <VideoEditModal
        video={editingVideo}
        isOpen={editingVideo !== null}
        onClose={() => setEditingVideo(null)}
      />

      {/* Payout Request Modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-white">Payout Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10.00"
                min="10"
                max={earningsStats.availableBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Available: ${earningsStats.availableBalance.toFixed(2)} (Min: $10.00)
              </p>
            </div>

            <div>
              <Label htmlFor="method" className="text-white">Payout Method</Label>
              <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select payout method" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="paypal" className="text-white">PayPal</SelectItem>
                  <SelectItem value="crypto" className="text-white">Cryptocurrency (BTC)</SelectItem>
                  <SelectItem value="bank_transfer" className="text-white">Bank Transfer (USA only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="details" className="text-white">
                {payoutMethod === 'paypal' ? 'PayPal Email' : 
                 payoutMethod === 'crypto' ? 'Bitcoin Wallet Address' : 
                 'Routing Number'}
              </Label>
              <Input
                id="details"
                placeholder={
                  payoutMethod === 'paypal' ? 'your@email.com' : 
                  payoutMethod === 'crypto' ? 'bc1q...' : 
                  '123456789'
                }
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="bg-gray-800 p-3 rounded-lg text-sm">
              <p className="text-white"><strong>Processing Time:</strong></p>
              <ul className="text-gray-400 mt-1 space-y-1">
                <li>• PayPal: 1-2 business days</li>
                <li>• Crypto: 1-24 hours</li>
                <li>• Bank Transfer: 3-5 business days</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutModal(false)} className="border-gray-700 text-white hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handlePayoutRequest}
              disabled={!payoutAmount || !payoutDetails || parseFloat(payoutAmount) < 10}
              className="bg-green-600 hover:bg-green-700"
            >
              Request ${payoutAmount || '0'} Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudioDashboard;