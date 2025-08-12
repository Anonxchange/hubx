
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Play, Pause, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadVideo } from '@/services/videosService';

const categories = [
  'Amateur', 'Anal', 'Asian', 'BBW', 'Big Ass', 'Big Tits', 'Blonde', 'Blowjob',
  'Brunette', 'Creampie', 'Cumshot', 'Deepthroat', 'Ebony', 'Fetish', 'Hardcore',
  'Latina', 'MILF', 'Masturbation', 'Mature', 'Oral', 'Orgasm', 'Pornstar',
  'POV', 'Public', 'Reality', 'Redhead', 'Solo', 'Squirting', 'Teen', 'Threesome'
];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // Check if user is a creator
  const userType = user?.user_metadata?.user_type;
  const isCreator = userType === 'individual_creator' || userType === 'studio_creator';

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Only verified creators can upload content to HubX.
          </p>
          <Button onClick={() => navigate('/creator-dashboard')}>
            Become a Creator
          </Button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 500MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const addCustomTag = () => {
    if (tagInput.trim() && !customTags.includes(tagInput.trim()) && customTags.length < 10) {
      setCustomTags([...customTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const uploadToBunnyStorage = async (file: File): Promise<string> => {
    // Use environment variables or fallback values
    const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE || 'hubx-videos';
    const BUNNY_ACCESS_KEY = import.meta.env.VITE_BUNNY_ACCESS_KEY || '';
    const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
    
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadUrl = `${BUNNY_STORAGE_URL}/${fileName}`;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 201) {
          // Return the CDN URL
          const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${fileName}`;
          resolve(cdnUrl);
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('AccessKey', BUNNY_ACCESS_KEY);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !title.trim() || !selectedCategory) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and select a video.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      setUploadProgress(20);
      
      // Upload video to Bunny CDN
      const videoUrl = await uploadToBunnyStorage(selectedFile);
      
      setUploadProgress(60);
      
      // Prepare tags array (category + custom tags)
      const allTags = [selectedCategory, ...customTags];
      
      // Save video metadata to Supabase using video service
      const videoData = {
        title: title.trim(),
        description: description.trim() || undefined,
        video_url: videoUrl,
        thumbnail_url: undefined, // Will be generated later
        preview_url: undefined, // Will be generated later
        duration: '00:00', // Placeholder, would be calculated from actual video
        tags: allTags,
        is_premium: isPremium,
        is_moment: false
      };

      setUploadProgress(80);

      const savedVideo = await uploadVideo(videoData);

      if (!savedVideo) {
        throw new Error('Failed to save video metadata to database');
      }

      setUploadProgress(100);
      
      toast({
        title: "Upload successful!",
        description: "Your video has been uploaded and is now live on HubX.",
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setCustomTags([]);
      setIsPremium(false);
      setUploadProgress(0);
      
      // Navigate back to dashboard
      navigate('/creator-dashboard');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-overlay rounded-lg p-2">
                <span className="text-xl font-bold text-white">HubX</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Upload Content
              </Badge>
            </div>
            <Button onClick={() => navigate(-1)} variant="outline" size="sm">
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload to HubX</h1>
          <p className="text-muted-foreground">
            Share your content with the world and start earning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Video Upload */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Video Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Upload your video</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: MP4, AVI, MOV, WMV (Max 500MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          src={previewUrl}
                          className="w-full h-64 object-cover rounded-lg"
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              onClick={togglePlay}
                              size="sm"
                              variant="secondary"
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                              type="button"
                              onClick={toggleMute}
                              size="sm"
                              variant="secondary"
                            >
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl('');
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {isUploading && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Video Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter video title"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {title.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your video..."
                      className="min-h-[100px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {description.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tags">Custom Tags</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add custom tags"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                      />
                      <Button type="button" onClick={addCustomTag} size="sm">
                        Add
                      </Button>
                    </div>
                    
                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {customTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {customTags.length}/10 tags
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="premium"
                      checked={isPremium}
                      onCheckedChange={setIsPremium}
                    />
                    <Label htmlFor="premium">Premium Content</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mark this video as premium content for subscribers only
                  </p>
                </CardContent>
              </Card>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || !title.trim() || !selectedCategory || isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
