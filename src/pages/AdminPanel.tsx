import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video as VideoIcon, BarChart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/admin/AdminLogin';
import VideoUploadForm from '@/components/admin/VideoUploadForm';
import VideoManagement from '@/components/admin/VideoManagement';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import VideoMigrationService from '@/services/videoMigrationService';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState({
    isProcessing: false,
    processed: 0,
    total: 0,
    completed: 0,
    errors: 0
  });

  const [migrationOptions, setMigrationOptions] = useState({
    generateStatic: true,
    generateAnimated: true
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleStartMigration = async () => {
    // Assuming migrateToWebPPreviews now accepts options
    await VideoMigrationService.migrateToWebPPreviews(migrationOptions, (processed, total) => {
      setMigrationStatus({
        isProcessing: true,
        processed,
        total,
        completed: 0,
        errors: 0
      });
    });

    // Update final status after migration completes or stops
    setMigrationStatus(prev => ({ ...prev, isProcessing: false }));
  };

  const handleStopMigration = () => {
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

          <TabsContent value="migration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <VideoIcon className="w-6 h-6" />
                  <span>WebP Preview Migration</span>
                </CardTitle>
                <CardDescription>
                  Convert existing video previews to optimized WebP format for better performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Migration Benefits:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Faster loading video thumbnails</li>
                    <li>• Reduced bandwidth consumption</li>
                    <li>• Better user experience on mobile</li>
                    <li>• Optimized CDN storage usage</li>
                    <li>• Animated previews for enhanced engagement</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Preview Options:</h4>
                  {migrationStatus.total > 0 && !migrationStatus.isProcessing && (
                    <div className="text-sm text-blue-600 mb-2">
                      📊 Found {migrationStatus.total} videos to migrate (estimated {VideoMigrationService.formatTime(VideoMigrationService.calculateEstimatedTime(migrationStatus.total))})
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={migrationOptions.generateStatic}
                        onChange={(e) => setMigrationOptions(prev => ({ ...prev, generateStatic: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-yellow-700">Generate static WebP previews (recommended)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={migrationOptions.generateAnimated}
                        onChange={(e) => setMigrationOptions(prev => ({ ...prev, generateAnimated: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-yellow-700">Generate animated WebP previews (larger files, better engagement)</span>
                    </label>
                  </div>
                </div>

                {migrationStatus.isProcessing && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Processing videos...</span>
                      <span>{migrationStatus.processed}/{migrationStatus.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${migrationStatus.total > 0 ? (migrationStatus.processed / migrationStatus.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    {migrationStatus.estimatedTimeRemaining && (
                      <div className="text-xs text-gray-600">
                        Estimated time remaining: {VideoMigrationService.formatTime(migrationStatus.estimatedTimeRemaining)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Completed: {migrationStatus.completed} | Errors: {migrationStatus.errors}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    onClick={handleStartMigration}
                    disabled={migrationStatus.isProcessing || (!migrationOptions.generateStatic && !migrationOptions.generateAnimated)}
                    className="flex items-center space-x-2"
                  >
                    {migrationStatus.isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <VideoIcon className="w-4 h-4" />
                    )}
                    <span>{migrationStatus.isProcessing ? 'Processing...' : 'Start Migration'}</span>
                  </Button>

                  {migrationStatus.isProcessing && (
                    <Button
                      onClick={handleStopMigration}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Stop Migration</span>
                    </Button>
                  )}
                </div>

                {migrationStatus.estimatedTimeRemaining && migrationStatus.isProcessing && (
                  <div className="text-sm text-blue-600">
                    ⏱️ Estimated time remaining: {VideoMigrationService.formatTime(migrationStatus.estimatedTimeRemaining)}
                  </div>
                )}

                {migrationStatus.completed > 0 && (
                  <div className="text-sm text-green-600">
                    ✅ Successfully migrated {migrationStatus.completed} videos to WebP format
                  </div>
                )}

                {migrationStatus.errors > 0 && (
                  <div className="text-sm text-red-600">
                    ⚠️ {migrationStatus.errors} videos failed to migrate
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;