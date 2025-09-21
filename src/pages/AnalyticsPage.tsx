import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart, Eye, Heart, TrendingUp, Clock, Users, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getUserStats } from '@/services/userStatsService';
import Header from '@/components/Header';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    subscribers: 0,
    avgViewTime: 0,
    engagement: 0,
    topVideo: null
  });
  const [recentViews, setRecentViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get creator-specific earnings and stats data
      const stats = await getUserStats(user.id);
      
      // Get creator earnings which contains actual view data
      const { data: creatorEarnings, error: earningsError } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .single();

      if (earningsError && earningsError.code !== 'PGRST116') {
        console.error('Error fetching creator earnings:', earningsError);
      }

      // Get view earnings records for this creator
      const { data: viewEarnings, error: viewError } = await supabase
        .from('view_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (viewError && viewError.code !== 'PGRST116') {
        console.error('Error fetching view earnings:', viewError);
      }

      // Get videos owned by this creator using owner_id
      const { data: creatorVideos, error: videosError } = await supabase
        .from('videos')
        .select('id, title, views, likes, created_at')
        .eq('owner_id', user.id)
        .order('views', { ascending: false });

      if (videosError && videosError.code !== 'PGRST116') {
        console.error('Error fetching creator videos:', videosError);
      }

      // Get recent activity from view earnings
      const recentActivity = viewEarnings?.slice(0, 10).map(ve => ({
        created_at: ve.created_at,
        video_id: ve.video_id,
        earnings_amount: ve.earnings_amount,
        is_premium: ve.is_premium
      })) || [];

      // Use actual creator video data
      const totalViews = creatorVideos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalLikes = creatorVideos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;
      const totalVideos = creatorVideos?.length || 0;
      const premiumViews = creatorEarnings?.total_premium_views || 0;
      
      // Calculate engagement rate based on actual data
      const totalInteractions = totalViews > 0 ? (totalLikes / totalViews * 100) : 0;

      setAnalytics({
        totalViews,
        totalLikes,
        totalVideos,
        subscribers: stats.subscribers,
        avgViewTime: stats.watchTimeMinutes / Math.max(totalViews / 100, 1), // Estimate based on actual views
        engagement: totalInteractions,
        topVideo: creatorVideos?.[0] || null
      });

      setRecentViews(recentActivity);
      
      console.log('Analytics data loaded:', {
        totalViews,
        totalVideos,
        totalLikes,
        engagement: totalInteractions,
        premiumViews
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (userType !== 'individual_creator' && userType !== 'studio_creator')) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800 text-white max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-400">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only creators can access analytics. Become a creator to view detailed performance metrics!</p>
            <Button className="w-full mt-4" onClick={() => navigate('/become-model')}>
              Become a Creator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <p className="text-lg">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <BarChart className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-blue-400">{analytics.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Likes</p>
                  <p className="text-2xl font-bold text-red-400">{analytics.totalLikes.toLocaleString()}</p>
                </div>
                <Heart className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Videos</p>
                  <p className="text-2xl font-bold text-purple-400">{analytics.totalVideos}</p>
                </div>
                <BarChart className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Engagement</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.engagement.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average View Time</span>
                    <span className="font-semibold">{analytics.avgViewTime.toFixed(1)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subscribers</span>
                    <span className="font-semibold">{analytics.subscribers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement Rate</span>
                    <span className="font-semibold text-green-400">{analytics.engagement.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Top Performing Video</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topVideo ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">{analytics.topVideo.title}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">{analytics.topVideo.views?.toLocaleString()} views</span>
                        <span className="text-red-400">{analytics.topVideo.likes?.toLocaleString()} likes</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Published {new Date(analytics.topVideo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No videos found</p>
                      <Button className="mt-4" onClick={() => navigate('/upload')}>
                        Upload Your First Video
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Video Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.totalVideos > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{analytics.totalVideos}</p>
                        <p className="text-gray-400 text-sm">Total Videos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{analytics.totalViews.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Total Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">{analytics.totalLikes.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Total Likes</p>
                      </div>
                    </div>
                    {analytics.topVideo && (
                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold mb-2">Top Performing Video</h4>
                        <div className="bg-gray-800 p-4 rounded">
                          <h5 className="font-medium text-white">{analytics.topVideo.title}</h5>
                          <div className="flex items-center justify-between mt-2 text-sm">
                            <span className="text-blue-400">{analytics.topVideo.views?.toLocaleString()} views</span>
                            <span className="text-red-400">{analytics.topVideo.likes?.toLocaleString()} likes</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No Videos Yet</h3>
                    <p className="text-gray-400 mb-4">Upload your first video to see performance metrics</p>
                    <Button onClick={() => navigate('/upload')}>Upload Video</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Audience Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <p className="text-2xl font-bold text-blue-400">{analytics.subscribers.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Subscribers</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p className="text-2xl font-bold text-green-400">{analytics.totalViews.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Total Views</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl font-bold text-purple-400">{analytics.avgViewTime.toFixed(1)}m</p>
                    <p className="text-gray-400 text-sm">Avg. Watch Time</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p className="text-2xl font-bold text-green-400">{analytics.engagement.toFixed(1)}%</p>
                    <p className="text-gray-400 text-sm">Engagement Rate</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Recent Activity</h4>
                  {recentViews.length > 0 ? (
                    <div className="space-y-2">
                      {recentViews.slice(0, 5).map((view: any, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                          <div>
                            <p className="font-medium">{view.videos?.title || 'Unknown Video'}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(view.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-400">{view.videos?.views || 0} views</p>
                            <p className="text-sm text-red-400">{view.videos?.likes || 0} likes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                      <p className="text-gray-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">Revenue Data</h3>
                  <p className="text-gray-400 mb-4">
                    For detailed earnings information, visit your earnings dashboard
                  </p>
                  <Button onClick={() => navigate('/earnings')}>
                    View Earnings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;