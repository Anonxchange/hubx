
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Video, BarChart3, MessageCircle, Settings, X, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { uploadVideo, getVideos, deleteVideo, VideoUpload } from '@/services/videosService';

const availableCategories = [
  'Ebony', 'Big Ass', 'Cumshot', 'Anal', 'Lesbian', 'MILF', 
  'Japanese', 'Hentai', 'Amateur', 'Teen', 'Blonde', 'Brunette', 
  'BBW', 'Blowjob', 'Creampie', 'Facial', 'Interracial', 'POV'
];

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const queryClient = useQueryClient();
  
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    previewUrl: '',
    duration: '',
    selectedCategories: [] as string[],
  });

  // Get videos for management
  const { data: videosData } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => getVideos(1, 50),
    enabled: isAuthenticated,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadVideo,
    onSuccess: () => {
      toast.success('Video uploaded successfully!');
      setUploadForm({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        previewUrl: '',
        duration: '',
        selectedCategories: [],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      toast.error('Failed to upload video: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      toast.success('Video deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      toast.error('Failed to delete video: ' + error.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'hubx2024admin') {
      setIsAuthenticated(true);
      toast.success('Welcome to HubX Admin Panel');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleCategoryToggle = (category: string) => {
    setUploadForm(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }));
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.title || !uploadForm.videoUrl) {
      toast.error('Title and video URL are required');
      return;
    }

    const videoData: VideoUpload = {
      title: uploadForm.title,
      description: uploadForm.description,
      video_url: uploadForm.videoUrl,
      thumbnail_url: uploadForm.thumbnailUrl,
      preview_url: uploadForm.previewUrl,
      duration: uploadForm.duration || '0:00',
      tags: uploadForm.selectedCategories.map(cat => cat.toLowerCase().replace(' ', '-')),
    };

    uploadMutation.mutate(videoData);
  };

  const handleDelete = (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      deleteMutation.mutate(videoId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>HubX Admin Access</CardTitle>
            <CardDescription>Enter password to access admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">HubX Admin Panel</h1>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Manage Videos</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Video</CardTitle>
                <CardDescription>
                  Upload a new video with title, description, and category tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title">Video Title *</Label>
                      <Input
                        id="title"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 12:34"
                        value={uploadForm.duration}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, duration: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="videoUrl">Video URL *</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      placeholder="https://example.com/video.mp4"
                      value={uploadForm.videoUrl}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                      <Input
                        id="thumbnailUrl"
                        type="url"
                        placeholder="https://example.com/thumbnail.jpg"
                        value={uploadForm.thumbnailUrl}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="previewUrl">Preview Video URL</Label>
                      <Input
                        id="previewUrl"
                        type="url"
                        placeholder="https://example.com/preview.mp4"
                        value={uploadForm.previewUrl}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, previewUrl: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <Label>Categories (select one or more)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                      {availableCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={uploadForm.selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                          />
                          <Label htmlFor={category} className="text-sm cursor-pointer">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Selected Categories Display */}
                    {uploadForm.selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {uploadForm.selectedCategories.map((category) => (
                          <Badge key={category} variant="secondary" className="flex items-center space-x-1">
                            <span>{category}</span>
                            <button
                              type="button"
                              onClick={() => handleCategoryToggle(category)}
                              className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!uploadForm.title || !uploadForm.videoUrl || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Manage Videos</CardTitle>
                <CardDescription>View and manage uploaded videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videosData?.videos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                          <img 
                            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=60&fit=crop'}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {video.views} views • {new Date(video.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {videosData?.videos.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No videos uploaded yet. Upload your first video!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{videosData?.totalCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Videos uploaded</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {videosData?.videos.reduce((sum, video) => sum + video.views, 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all videos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{availableCategories.length}</div>
                  <p className="text-xs text-muted-foreground">Available categories</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {videosData?.videos.length ? 
                      Math.round(videosData.videos.reduce((sum, video) => sum + video.views, 0) / videosData.videos.length) : 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Per video</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
