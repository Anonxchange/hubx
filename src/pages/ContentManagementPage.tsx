import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Image, Music, Trash2, Edit, Eye, Download, Upload, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const ContentManagementPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserContent();
    }
  }, [user]);

  const fetchUserContent = async () => {
    try {
      setLoading(true);
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your content. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Transform data to match our content structure
      const transformedContent = videos?.map(video => ({
        id: video.id,
        title: video.title,
        type: 'video',
        status: 'published', // You can add status field to videos table if needed
        views: video.views || 0,
        likes: video.likes || 0,
        uploadDate: new Date(video.created_at).toLocaleDateString(),
        thumbnail: video.thumbnail_url || 'https://via.placeholder.com/160x90',
        duration: video.duration || null,
        description: video.description,
        isPremium: video.is_premium
      })) || [];

      setContent(transformedContent);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', contentId)
        .eq('owner_id', user.id); // Security check

      if (error) {
        console.error('Error deleting content:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete content. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Content deleted successfully.',
      });

      // Refresh content list
      fetchUserContent();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const stats = {
    totalContent: content.length,
    published: content.filter(item => item.status === 'published').length,
    drafts: content.filter(item => item.status === 'draft').length,
    totalViews: content.reduce((sum, item) => sum + item.views, 0),
    totalLikes: content.reduce((sum, item) => sum + item.likes, 0)
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = searchQuery === '' || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <p className="text-lg">Loading your content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-600 hover:bg-green-700">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            <p>Only creators can access content management. Become a creator to start managing content!</p>
            <Button className="w-full mt-4" onClick={() => navigate('/become-model')}>
              Become a Creator
            </Button>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold">Content Management</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.totalContent}</p>
                <p className="text-sm text-gray-400">Total Content</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.published}</p>
                <p className="text-sm text-gray-400">Published</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.drafts}</p>
                <p className="text-sm text-gray-400">Drafts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Views</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{stats.totalLikes}</p>
                <p className="text-sm text-gray-400">Total Likes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => navigate('/upload')} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-4">
              {filteredContent.length > 0 ? (
                filteredContent.map((item) => (
                  <Card key={item.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-20 h-12 object-cover rounded bg-gray-800"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {getContentIcon(item.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {item.views.toLocaleString()} views
                            </span>
                            <span>{item.uploadDate}</span>
                            {item.duration && <span>{item.duration}</span>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusBadge(item.status)}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/video/${item.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this content?')) {
                                handleDeleteContent(item.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">
                      {content.length === 0 ? 'No content yet' : 'No content matches your filters'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                      {content.length === 0 
                        ? 'Start uploading content to manage your library'
                        : 'Try adjusting your search or filter criteria'
                      }
                    </p>
                    <Button onClick={() => navigate('/upload')}>
                      <Plus className="w-4 h-4 mr-2" />
                      {content.length === 0 ? 'Upload Your First Content' : 'Upload New Content'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold mb-2">Video content will appear here</h3>
              <p className="text-gray-400">Upload videos to see them in this section</p>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold mb-2">Image content will appear here</h3>
              <p className="text-gray-400">Upload images to see them in this section</p>
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="text-center py-12">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold mb-2">Audio content will appear here</h3>
              <p className="text-gray-400">Upload audio files to see them in this section</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentManagementPage;