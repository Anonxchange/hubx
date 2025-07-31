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
import TagManager from './TagManager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadVideo, VideoUpload } from '@/services/videosService';
import { supabase } from '@/integrations/supabase/client';

const VideoUploadForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  const [formData, setFormData] = useState<VideoUpload & { is_premium?: boolean }>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    preview_url: '',
    duration: '',
    tags: [],
    is_premium: false
  });

  const uploadMutation = useMutation({
    mutationFn: uploadVideo,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
      setIsProcessing(false);
      setUploadProgress(0);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      preview_url: '',
      duration: '',
      tags: [],
      is_premium: false
    });
    setCustomTags([]);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsProcessing(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate title from filename if empty
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const processVideoFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Create form data for the edge function
      const uploadFormData = new FormData();
      uploadFormData.append('video', file);
      uploadFormData.append('title', formData.title || file.name);

      // Call the video processing edge function
      const { data, error } = await supabase.functions.invoke('process-video', {
        body: uploadFormData
      });

      if (error) throw error;

      // Update form with processed video URLs
      setFormData(prev => ({
        ...prev,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        preview_url: data.preview_url,
        duration: data.duration
      }));

      setUploadProgress(100);
      
      toast({
        title: "Processing Complete",
        description: "Video processed successfully! You can now submit the form.",
      });

    } catch (error) {
      console.error('Video processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process video. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }

    if (uploadMethod === 'file') {
      if (!selectedFile) {
        toast({
          title: "Validation Error",
          description: "Please select a video file.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.video_url) {
        // Process the file first
        await processVideoFile(selectedFile);
        return;
      }
    } else {
      if (!formData.video_url) {
        toast({
          title: "Validation Error",
          description: "Video URL is required.",
          variant: "destructive",
        });
        return;
      }
    }

    uploadMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Upload New Video</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload method selection */}
          <div className="flex space-x-4 p-4 bg-muted rounded-lg">
            <Button
              type="button"
              variant={uploadMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('file')}
              className="flex items-center space-x-2"
            >
              <FileVideo className="w-4 h-4" />
              <span>Upload File</span>
            </Button>
            <Button
              type="button"
              variant={uploadMethod === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('url')}
              className="flex items-center space-x-2"
            >
              <Video className="w-4 h-4" />
              <span>Use URL</span>
            </Button>
          </div>

          {/* File upload section */}
          {uploadMethod === 'file' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-file">Select Video File</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing video...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {formData.video_url && selectedFile && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">✅ Video processed successfully!</p>
                  <div className="mt-2 space-y-1 text-xs text-green-600">
                    <p>Video URL: {formData.video_url}</p>
                    <p>Thumbnail URL: {formData.thumbnail_url}</p>
                    <p>Preview URL: {formData.preview_url}</p>
                    <p>Duration: {formData.duration}</p>
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Premium Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Switch
              id="premium"
              checked={formData.is_premium}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_premium: checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="premium" className="text-base font-medium cursor-pointer">
                Premium Content
              </Label>
              <p className="text-sm text-muted-foreground">
                Mark this video as premium content (requires VIP access)
              </p>
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

          {/* URL input section - only show if using URL method or after file processing */}
          {(uploadMethod === 'url' || (uploadMethod === 'file' && formData.video_url)) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="video_url">Video URL{uploadMethod === 'url' ? '*' : ''}</Label>
                <Input
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/video.mp4"
                  required={uploadMethod === 'url'}
                  readOnly={uploadMethod === 'file'}
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
                  readOnly={uploadMethod === 'file'}
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
                  readOnly={uploadMethod === 'file'}
                />
              </div>
            </div>
          )}

          <TagManager
            customTags={customTags}
            newTag={newTag}
            onNewTagChange={setNewTag}
            onAddCustomTag={addCustomTag}
            onRemoveCustomTag={removeCustomTag}
            onAddPresetTag={addPresetTag}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={uploadMutation.isPending || isProcessing}
          >
            {uploadMutation.isPending 
              ? 'Uploading...' 
              : isProcessing 
                ? 'Processing Video...' 
                : uploadMethod === 'file' && selectedFile && !formData.video_url
                  ? 'Process Video'
                  : 'Upload Video'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;