import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  const [formData, setFormData] = useState<VideoUpload>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    preview_url: '',
    duration: '',
    tags: []
  });

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
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;