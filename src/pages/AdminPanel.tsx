import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video as VideoIcon, BarChart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/admin/AdminLogin';
import VideoUploadForm from '@/components/admin/VideoUploadForm';
import VideoManagement from '@/components/admin/VideoManagement';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import PayoutManagement from '@/components/admin/PayoutManagement';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };


  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">HubX Admin Panel</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Site
          </Button>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center space-x-2">
              <VideoIcon className="w-4 h-4" />
              <span>Manage Videos</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Payouts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <VideoUploadForm />
          </TabsContent>

          <TabsContent value="manage">
            <VideoManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;