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

  // Moment toggle state
  const [isMomentVideo, setIsMomentVideo] = useState(false);

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

  // Wrap the original uploadVideo to inject moment tags if toggled ON
  const uploadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Combine custom tags + moment tags if toggled
      let finalTags = [...data.tags, ...customTags];
      if (isMomentVideo) {
        finalTags = [...finalTags, 'vertical', 'short', 'moment'];
      }

      // Use the original uploadVideo but override tags with finalTags
      return uploadVideo({ ...data, tags: finalTags });
    },
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
    setIsMomentVideo(false);
  };

  // ... (all your existing functions stay unchanged)

  // Add this moment toggle UI block above your tags or premium toggle in your form JSX:

  /*
  <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
    <Switch
      id="moment-video"
      checked={isMomentVideo}
      onCheckedChange={setIsMomentVideo}
      className="data-[state=checked]:bg-orange-500"
    />
    <div>
      <Label htmlFor="moment-video" className="text-sm font-medium cursor-pointer">
        Moment Video
      </Label>
      <p className="text-xs text-muted-foreground">
        Enable for short vertical videos that go to the moments feed (adds 'vertical', 'short', 'moment' tags automatically)
      </p>
    </div>
  </div>
  */

  // The rest of your form JSX and handlers stay exactly as before, 
  // just add the above moment toggle block somewhere near tags or premium toggle.

  // In your handleSubmit, no need to change anything because uploadMutation now injects the moment tags.

  // Full return JSX with moment toggle added below for clarity:

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
          {/* Upload method buttons here (unchanged) */}

          {/* File upload section here (unchanged) */}

          {/* Title, Duration, Description, etc. unchanged */}

          {/* Moment Toggle added here */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Switch
              id="moment-video"
              checked={isMomentVideo}
              onCheckedChange={setIsMomentVideo}
              className="data-[state=checked]:bg-orange-500"
            />
            <div>
              <Label htmlFor="moment-video" className="text-sm font-medium cursor-pointer">
                Moment Video
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable for short vertical videos that go to the moments feed (adds 'vertical', 'short', 'moment' tags automatically)
              </p>
            </div>
          </div>

          {/* Your existing TagManager component here */}
          <TagManager
            customTags={customTags}
            newTag={newTag}
            onNewTagChange={setNewTag}
            onAddCustomTag={addCustomTag}
            onRemoveCustomTag={removeCustomTag}
            onAddPresetTag={addPresetTag}
          />

          {/* Premium toggle & submit button remain unchanged */}

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