
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, BarChart, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadVideo, deleteVideo, VideoUpload } from '@/services/videosService';
import { useVideos } from '@/hooks/useVideos';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Video upload form state
  const [formData, setFormData] = useState<VideoUpload>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    preview_url: '',
    duration: '',
    tags: []
  });

  const { data: videosData } = useVideos(1, 100);
  const videos = videosData?.videos || [];

  const uploadMutation = useMutation({
    mutationFn: uploadVideo,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      setFormData({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        preview_url: '',
        duration: '',
        tags: []
      });
      setCustomTags([]);
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'hubx2024admin') {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin panel!",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      const updatedTags = [...customTags, newTag.trim()];
      setCustomTags(updatedTags);
      setFormData(prev => ({
        ...prev,
        tags: updatedTags
      }));
      setNewTag('');
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    const updatedTags = customTags.filter(tag => tag !== tagToRemove);
    setCustomTags(updatedTags);
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };

  const addPresetTag = (tag: string) => {
    if (!customTags.includes(tag)) {
      const updatedTags = [...customTags, tag];
      setCustomTags(updatedTags);
      setFormData(prev => ({
        ...prev,
        tags: updatedTags
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.video_url) {
      toast({
        title: "Validation Error",
        description: "Title and video URL are required.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(formData);
  };

  const handleDelete = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteMutation.mutate(videoId);
    }
  };

  const presetTags = [
    'ebony', 'big-ass', 'cumshot', 'anal', 'lesbian', 'milf', 
    'japanese', 'hentai', 'amateur', 'hardcore', 'threesome', 
    'blonde', 'brunette', 'redhead', 'big-tits', 'petite'
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Access</CardTitle>
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
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Manage Videos</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Video</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title*</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter video title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        placeholder="e.g., 12:34"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter video description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="video_url">Video URL*</Label>
                      <Input
                        id="video_url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/video.mp4"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                      <Input
                        id="thumbnail_url"
                        name="thumbnail_url"
                        value={formData.thumbnail_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/thumb.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preview_url">Preview URL</Label>
                      <Input
                        id="preview_url"
                        name="preview_url"
                        value={formData.preview_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/preview.mp4"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    
                    {/* Custom Tag Input */}
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add custom tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addCustomTag} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Preset Tags */}
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Quick add preset tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {presetTags.map((tag) => (
                          <Button
                            key={tag}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addPresetTag(tag)}
                            disabled={customTags.includes(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Tags */}
                    {customTags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Selected tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {customTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                              <span>{tag}</span>
                              <X 
                                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                                onClick={() => removeCustomTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Manage Videos ({videos.length} total)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=60&fit=crop'}
                          alt={video.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {video.views} views • {video.likes || 0} likes • {video.dislikes || 0} dislikes
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{video.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDelete(video.id)}
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {videos.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No videos uploaded yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{videos.length}</div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
