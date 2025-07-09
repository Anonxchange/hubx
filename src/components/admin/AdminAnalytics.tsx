import React from 'react';
import { BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVideos } from '@/hooks/useVideos';

const AdminAnalytics = () => {
  const { data: videosData } = useVideos(1, 40);
  const videos = videosData?.videos || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="w-5 h-5" />
            <span>Total Videos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{videosData?.totalCount || 0}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {videos.reduce((sum, video) => sum + video.views, 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {videos.reduce((sum, video) => sum + (video.likes || 0) + (video.dislikes || 0), 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;