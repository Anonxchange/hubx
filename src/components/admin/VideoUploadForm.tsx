import React, { useState } from 'react';
import { Upload, Video, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const VideoUploadForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMomentVideo, setIsMomentVideo] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    preview_url: '',
    duration: '',
    tags: [] as string[],
    is_premium: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  // Keep using FormData upload to match your existing edge function
  const processVideoFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('video', file);
      formDataToSend.append('title', formData.title || file.name);

      const { data, error } = await supabase.functions.invoke('process-video', {
        body: formDataToSend,
        // DO NOT set Content-Type header here! Let the browser handle multipart boundary.
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        preview_url: data.preview_url,
        duration: data.duration,
      }));

      setUploadProgress(100);

      toast({
        title: 'Processing Complete',
        description: 'Video processed successfully! You can now submit the form.',
      });
    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: 'Processing Failed',
        description: `Failed to process video: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (videoData: typeof formData) => {
      // Merge tags & add moment tags if toggle is on
      let finalTags = [...videoData.tags, ...customTags];
      if (isMomentVideo) {
        finalTags = [...finalTags, 'vertical', 'short', 'moment'];
      }

      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: videoData.title,
          description: videoData.description,
          video_url: videoData.video_url,
          thumbnail_url: videoData.thumbnail_url,
          preview_url: videoData.preview_url,
          duration: videoData.duration,
          tags: finalTags,
          is_premium: videoData.is_premium,
          views: 0,
          likes: 0,
          dislikes: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: isMomentVideo
          ? 'Moment video uploaded successfully!'
          : 'Video uploaded successfully!',
      });

      setFormData({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        preview_url: '',
        duration: '',
        tags: [],
        is_premium: false,
      });
      setCustomTags([]);
      setSelectedFile(null);
      setIsMomentVideo(false);
      setUploadProgress(0);

      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: error => {
      toast({
        title: 'Upload Failed',
        description: `Failed to upload video: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.video_url) {
      toast({
        title: 'Error',
        description: 'Please process a video file first.',
        variant: 'destructive',
      });
      return;
    }
    uploadMutation.mutate(formData);
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          {isMomentVideo ? 'Upload Moment Video' : 'Upload Video'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Moment Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Switch
              id="moment-video"
              checked={isMomentVideo}
              onCheckedChange={setIsMomentVideo}
              className="data-[state=checked]:bg-orange-500"
            />
            <div>
              <Label htmlFor="moment-video" className="text-sm font-medium">
                Moment Video
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable for short vertical videos that go to the moments feed
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Button
                  type="button"
                  onClick={() => processVideoFile(selectedFile)}
                  disabled={isProcessing}
                  className="shrink-0"
                >
                  {isProcessing ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileVideo className="w-4 h-4 mr-2" />
                      Process Video
                    </>
                  )}
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Progress */}
          {(isProcessing || uploadProgress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Title & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter video title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 05:30"
                readOnly
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter video description"
              className="min-h-[100px]"
            />
          </div>

          {/* URLs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                name="video_url"
                value={formData.video_url}
                readOnly
                placeholder="Video URL (auto-filled after processing)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                readOnly
                placeholder="Thumbnail URL (auto-filled after processing)"
              />
            </div>
          </div>

          {/* Custom Tags */}
          <div className="space-y-4">
            <Label>Custom Tags</Label>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add custom tag"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              />
              <Button type="button" onClick={addCustomTag}>
                Add Tag
              </Button>
            </div>

            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeCustomTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isMomentVideo && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <strong>Moment Video Tags:</strong> 'vertical', 'short', 'moment' will be
                  automatically added
                </p>
              </div>
            )}
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_premium"
              checked={formData.is_premium}
              onCheckedChange={checked => setFormData(prev => ({ ...prev, is_premium: checked }))}
            />
            <Label htmlFor="is_premium">Premium Content</Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={uploadMutation.isLoading || !formData.video_url}
          >
            {uploadMutation.isLoading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {isMomentVideo ? 'Upload Moment Video' : 'Upload Video'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;