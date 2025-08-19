import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video as VideoIcon, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLogin from '@/components/admin/AdminLogin';
import VideoUploadForm from '@/components/admin/VideoUploadForm';
import VideoManagement from '@/components/admin/VideoManagement';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import VideoMigrationService from '@/services/videoMigrationService';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState({
    isProcessing: false,
    processed: 0,
    total: 0,
    progress: 0
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const startMigration = async () => {
    await VideoMigrationService.migrateToWebPPreviews(3, (processed, total) => {
      setMigrationStatus({
        isProcessing: true,
        processed,
        total,
        progress: (processed / total) * 100
      });
    });

    // Update final status
    setMigrationStatus(prev => ({ ...prev, isProcessing: false }));
  };

  const stopMigration = () => {
    VideoMigrationService.stopMigration();
    setMigrationStatus(prev => ({ ...prev, isProcessing: false }));
  };

  // Update migration status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = VideoMigrationService.getMigrationStatus();
      setMigrationStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, []);


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
            <TabsTrigger value="migration" className="flex items-center space-x-2">
              <VideoIcon className="w-4 h-4" />
              <span>Migration</span>
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

          <TabsContent value="migration">
            <Card>
              <CardHeader>
                <CardTitle>WebP Migration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  {migrationStatus.isProcessing ? (
                    <>
                      <p>
                        Processing video previews to WebP...
                      </p>
                      <Progress value={migrationStatus.progress} className="w-full" />
                      <p>
                        {migrationStatus.processed} / {migrationStatus.total} videos processed
                      </p>
                      <Button onClick={stopMigration} variant="destructive">
                        Stop Migration
                      </Button>
                    </>
                  ) : (
                    <>
                      <p>Migrate existing video previews to WebP format.</p>
                      <Button onClick={startMigration} disabled={migrationStatus.total > 0 && migrationStatus.processed < migrationStatus.total}>
                        Start Migration
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;