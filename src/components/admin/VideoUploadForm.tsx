import React, { useState } from 'react';
import { Upload, Video, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import TagManager from './TagManager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadVideo, VideoUpload } from '@/services/videosService';

const VideoUploadForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<
    VideoUpload & { is_premium: boolean; is_moment: boolean }
  >({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    preview_url: '',
    duration: '',
    tags: [],
    is_premium: false,
    is_moment: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Merge tags: form tags + custom tags + moment tags if enabled
      let finalTags = [...(data.tags || []), ...customTags];
      if (data.is_moment) {
        finalTags = [...finalTags, 'vertical', 'short', 'moment'];
      }
      // Send all data including flags exactly as provided, just with final tags merged
      return uploadVideo({ ...data, tags: finalTags });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Video uploaded successfully!',
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
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
      is_premium: false,
      is_moment: false,
    });
    setCustomTags([]);
    setSelectedFile(null);
    setIsProcessing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      const updatedTags = [...customTags, newTag.trim()];
      setCustomTags(updatedTags);
      setFormData((prev) => ({ ...prev, tags: updatedTags }));
      setNewTag('');
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    const updatedTags = customTags.filter((tag) => tag !== tagToRemove);
    setCustomTags(updatedTags);
    setFormData((prev) => ({ ...prev, tags: updatedTags }));
  };

  const addPresetTag = (tag: string) => {
    if (!customTags.includes(tag)) {
      const updatedTags = [...customTags, tag];
      setCustomTags(updatedTags);
      setFormData((prev) => ({ ...prev, tags: updatedTags }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData((prev) => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast({
        title: 'Validation Error',
        description: 'Title is required.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMethod === 'file' && !formData.video_url && !selectedFile) {
      toast({
        title: 'Validation Error',
        description: 'Please select and process a video file.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMethod === 'url' && !formData.video_url) {
      toast({
        title: 'Validation Error',
        description: 'Video URL is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
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
          {/* Upload method selector */}
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
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {/* Title and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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

          {/* Moment toggle */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Switch
              id="moment-video"
              checked={formData.is_moment}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_moment: checked }))
              }
              className="data-[state=checked]:bg-orange-500"
            />
            <div>
              <Label
                htmlFor="moment-video"
                className="text-sm font-medium cursor-pointer"
              >
                Moment Video
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable for short vertical videos that go to the moments feed
                (adds 'vertical', 'short', 'moment' tags automatically)
              </p>
            </div>
          </div>

          {/* Description */}
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

          {/* URLs input, readonly if file method */}
          {(uploadMethod === 'url' || (uploadMethod === 'file' && formData.video_url)) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="video_url">
                  Video URL{uploadMethod === 'url' ? '*' : ''}
                </Label>
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

          {/* Tag manager */}
          <TagManager
            customTags={customTags}
            newTag={newTag}
            onNewTagChange={setNewTag}
            onAddCustomTag={addCustomTag}
            onRemoveCustomTag={removeCustomTag}
            onAddPresetTag={addPresetTag}
          />

          {/* Premium toggle */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Switch
              id="premium"
              checked={formData.is_premium}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_premium: checked }))
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="premium"
                className="text-base font-medium cursor-pointer"
              >
                Premium Content
              </Label>
              <p className="text-sm text-muted-foreground">
                Mark this video as premium content (requires VIP access)
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={uploadMutation.isLoading || isProcessing}
          >
            {uploadMutation.isLoading
              ? 'Uploading...'
              : isProcessing
              ? 'Processing Video...'
              : uploadMethod === 'file' && selectedFile && !formData.video_url
              ? 'Process Video'
              : 'Upload Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;