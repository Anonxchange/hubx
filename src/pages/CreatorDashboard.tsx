import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, User, CheckCircle, Upload, BarChart3, DollarSign, Settings, Play, Eye, ThumbsUp, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideo, updateVideo, Video } from '@/services/videosService';
import { useToast } from '@/hooks/use-toast';
import VideoEditModal from '@/components/admin/VideoEditModal';
import { getCreatorEarnings, getViewEarnings, getCreatorPayouts, requestPayout, EarningsStats, ViewEarning, Payout } from '@/services/earningsService';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accountType] = useState<'individual' | 'business'>('individual');
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    subscribers: 0
  });
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
  const [loading, setLoading] = useState(true);
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
      fetchCreatorContent();
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
    mutationFn: ({ videoId, updates }: { videoId: string; updates: Partial<Video> }) => 
      updateVideo(videoId, updates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video updated successfully!",
      });
      setEditingVideo(null);
      // Refresh the videos list
      fetchCreatorContent();
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
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  const fetchCreatorContent = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch uploaded videos
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creator content:', error);
        return;
      }

      setUploadedVideos(videos || []);
      
      // Calculate stats
      const totalViews = videos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
      const totalLikes = videos?.reduce((sum, video) => sum + (video.likes || 0), 0) || 0;
      
      setStats({
        totalVideos: videos?.length || 0,
        totalViews,
        totalLikes,
        subscribers: 0 // TODO: Implement subscriber count
      });

      // Also fetch earnings data
      await fetchEarningsData();
    } catch (error) {
      console.error('Error fetching creator content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorContent();
  }, [user?.id]);

  const handleDelete = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate(videoId);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
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
          toast({
            title: "Error",
            description: "Failed to update thumbnail in database",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Thumbnail updated successfully!",
          });
          // Refresh the videos list
          fetchCreatorContent();
        }
      } else {
        console.error('Failed to upload thumbnail:', uploadResult.error);
        toast({
          title: "Error",
          description: "Failed to upload thumbnail. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Error",
        description: "Error uploading thumbnail. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="gradient-overlay rounded-lg p-2">
                <span className="text-lg sm:text-xl font-bold text-white">HubX</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs sm:text-sm">
                Creator Studio
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">Welcome, {user.email}</span>
              <span className="text-xs sm:text-sm text-muted-foreground md:hidden">Welcome</span>
              <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                <span className="hidden sm:inline">Back to Site</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Creator Dashboard</h1>
              <p className="text-muted-foreground">Manage your content and earnings</p>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Videos</p>
                    <p className="text-2xl font-bold">{stats.totalVideos}</p>
                  </div>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">${earningsStats.totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: ${earningsStats.availableBalance.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subscribers</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
              <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Earnings</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">This Month</span>
                        <span className="font-semibold">$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Views</span>
                        <span className="font-semibold">{stats.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Videos</span>
                        <span className="font-semibold">{stats.totalVideos}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={() => navigate('/upload')} className="w-full" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Video
                    </Button>
                    <Button onClick={() => navigate('/analytics')} className="w-full" variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button onClick={() => navigate('/earnings')} className="w-full" variant="outline">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Check Earnings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <div className="space-y-6">
                {/* Earnings Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <h3 className="text-2xl font-bold text-green-600">
                        ${earningsStats.availableBalance.toFixed(2)}
                      </h3>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <h3 className="text-2xl font-bold">
                        ${earningsStats.thisMonth.toFixed(2)}
                      </h3>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <h3 className="text-2xl font-bold">
                        ${earningsStats.totalEarnings.toFixed(2)}
                      </h3>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <h3 className="text-2xl font-bold">
                        ${earningsStats.pendingPayouts.toFixed(2)}
                      </h3>
                      <p className="text-sm text-muted-foreground">Pending Payouts</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Earnings Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span>View Earnings ({earningsStats.totalViews + earningsStats.premiumViews} views)</span>
                        <span className="font-bold">${earningsStats.viewEarnings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span>Tips & Donations</span>
                        <span className="font-bold">${earningsStats.totalTips.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span>Premium Revenue</span>
                        <span className="font-bold">${earningsStats.premiumRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Section */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Payout Management</CardTitle>
                      <Button 
                        onClick={() => setShowPayoutModal(true)}
                        disabled={earningsStats.availableBalance < 10}
                      >
                        Request Payout
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {payouts.length > 0 ? (
                        payouts.slice(0, 5).map((payout) => (
                          <div key={payout.id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">${payout.amount.toFixed(2)} via {payout.payout_method}</p>
                              <p className="text-sm text-muted-foreground">
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
                        <p className="text-center py-6 text-muted-foreground">
                          No payout history yet. Minimum payout is $10.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent View Earnings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent View Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {viewEarnings.length > 0 ? (
                        viewEarnings.slice(0, 10).map((earning) => (
                          <div key={earning.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="text-sm font-medium">
                                {(earning as any).videos?.title || 'Video'} 
                                {earning.is_premium && <Badge className="ml-2" variant="secondary">Premium</Badge>}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(earning.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                +${earning.earnings_amount.toFixed(4)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${earning.earnings_rate_per_1k.toFixed(2)}/1k views
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-muted-foreground">
                          No view earnings yet. Upload content and get views to start earning!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Content to HubX</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Share Your Content</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload high-quality videos to engage your audience and start earning
                    </p>
                    <Button onClick={() => navigate('/upload')} size="lg" className="px-8">
                      <Upload className="w-4 h-4 mr-2" />
                      Go to Upload Panel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management">
              <Card>
                <CardHeader>
                  <CardTitle>HubX Content Management ({stats.totalVideos} videos)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-4">Loading your content...</p>
                    </div>
                  ) : uploadedVideos.length > 0 ? (
                    <div className="space-y-4">
                      {uploadedVideos.map((video) => (
                        <div key={video.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                              {video.duration || '00:00'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2 mb-2">{video.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
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
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {video.tags?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{video.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/video/${video.id}`)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(video)}
                              disabled={updateMutation.isPending}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
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
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No content uploaded yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start uploading content to build your audience and earn revenue
                      </p>
                      <Button onClick={() => navigate('/upload')} className="px-8">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Video
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Performers Core Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Profile Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Account Type: {accountType === 'individual' ? 'Individual Creator' : 'Business Account'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: Verified Creator
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Content Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-publish content</span>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Default privacy settings</span>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Support & Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-16 flex-col">
                      <FileText className="w-6 h-6 mb-2" />
                      Creator Guide
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <User className="w-6 h-6 mb-2" />
                      Contact Support
                    </Button>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Need Help?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our support team is here to help you succeed on HubX
                    </p>
                    <Button variant="outline" size="sm">
                      Submit Support Ticket
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        navigate('/auth');
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Video Edit Modal */}
      <VideoEditModal
        video={editingVideo}
        isOpen={editingVideo !== null}
        onClose={() => setEditingVideo(null)}
      />

      {/* Payout Request Modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payout Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10.00"
                min="10"
                max={earningsStats.availableBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: ${earningsStats.availableBalance.toFixed(2)} (Min: $10.00)
              </p>
            </div>

            <div>
              <Label htmlFor="method">Payout Method</Label>
              <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payout method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency (BTC)</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer (USA only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="details">
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
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p><strong>Processing Time:</strong></p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>• PayPal: 1-2 business days</li>
                <li>• Crypto: 1-24 hours</li>
                <li>• Bank Transfer: 3-5 business days</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayoutRequest}
              disabled={!payoutAmount || !payoutDetails || parseFloat(payoutAmount) < 10}
            >
              Request ${payoutAmount || '0'} Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorDashboard;