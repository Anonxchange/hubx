import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import TagManager from './TagManager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVideo, VideoUpload, Video } from '@/services/videosService';

interface VideoEditModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoEditModal = ({ video, isOpen, onClose }: VideoEditModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editCustomTags, setEditCustomTags] = useState<string[]>([]);
  const [editNewTag, setEditNewTag] = useState('');
  
  const [editFormData, setEditFormData] = useState<VideoUpload>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    preview_url: '',
    duration: '',
    tags: []
  });

  useEffect(() => {
    if (video) {
      setEditFormData({
        title: video.title,
        description: video.description || '',
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url || '',
        preview_url: video.preview_url || '',
        duration: video.duration || '',
        tags: video.tags
      });
      setEditCustomTags(video.tags);
    }
  }, [video]);

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<VideoUpload> }) => updateVideo(id, updates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video updated successfully!",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addEditCustomTag = () => {
    if (editNewTag.trim() && !editCustomTags.includes(editNewTag.trim())) {
      const updatedTags = [...editCustomTags, editNewTag.trim()];
      setEditCustomTags(updatedTags);
      setEditFormData(prev => ({
        ...prev,
        tags: updatedTags
      }));
      setEditNewTag('');
    }
  };

  const removeEditCustomTag = (tagToRemove: string) => {
    const updatedTags = editCustomTags.filter(tag => tag !== tagToRemove);
    setEditCustomTags(updatedTags);
    setEditFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };

  const addEditPresetTag = (tag: string) => {
    if (!editCustomTags.includes(tag)) {
      const updatedTags = [...editCustomTags, tag];
      setEditCustomTags(updatedTags);
      setEditFormData(prev => ({
        ...prev,
        tags: updatedTags
      }));
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.video_url || !video) {
      toast({
        title: "Validation Error",
        description: "Title and video URL are required.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({ id: video.id, updates: editFormData });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-title">Title*</Label>
              <Input
                id="edit-title"
                name="title"
                value={editFormData.title}
                onChange={handleEditInputChange}
                placeholder="Enter video title"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-duration">Duration</Label>
              <Input
                id="edit-duration"
                name="duration"
                value={editFormData.duration}
                onChange={handleEditInputChange}
                placeholder="e.g., 12:34"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              value={editFormData.description}
              onChange={handleEditInputChange}
              placeholder="Enter video description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-video_url">Video URL*</Label>
              <Input
                id="edit-video_url"
                name="video_url"
                value={editFormData.video_url}
                onChange={handleEditInputChange}
                placeholder="https://example.com/video.mp4"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-thumbnail_url">Thumbnail URL</Label>
              <Input
                id="edit-thumbnail_url"
                name="thumbnail_url"
                value={editFormData.thumbnail_url}
                onChange={handleEditInputChange}
                placeholder="https://example.com/thumb.jpg"
              />
            </div>
            <div>
              <Label htmlFor="edit-preview_url">Preview URL</Label>
              <Input
                id="edit-preview_url"
                name="preview_url"
                value={editFormData.preview_url}
                onChange={handleEditInputChange}
                placeholder="https://example.com/preview.mp4"
              />
            </div>
          </div>

          <TagManager
            customTags={editCustomTags}
            newTag={editNewTag}
            onNewTagChange={setEditNewTag}
            onAddCustomTag={addEditCustomTag}
            onRemoveCustomTag={removeEditCustomTag}
            onAddPresetTag={addEditPresetTag}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Video'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditModal;