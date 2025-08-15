import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Video, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadVideo } from '@/services/videosService'; // Assuming this service exists

interface VideoUploadFormProps {
  onVideoAdded: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onVideoAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Bunny Stream configuration - hardcoded since env variables aren't loading properly
  const BUNNY_STREAM_LIBRARY_ID = '476242';
  const BUNNY_STREAM_ACCESS_KEY = 'f6fc4579-a3e4-484d-8387361ef995-6653-4a7b';
  const BUNNY_STREAM_API_URL = 'https://video.bunnycdn.com/library';
  const BUNNY_STREAM_CDN_URL = 'https://vz-a3bd9097-45c.b-cdn.net';

  const categories = [
    'Amateur',
    'Anal',
    'Asian',
    'BBW',
    'BDSM',
    'Big Ass',
    'Big Tits',
    'Blonde',
    'Blowjob',
    'Brunette',
    'Compilation',
    'Creampie',
    'Cumshot',
    'Ebony',
    'Fetish',
    'Hardcore',
    'Lesbian',
    'MILF',
    'Pornstar',
    'POV',
    'Public',
    'Teen',
    'Threesome',
    'Vintage'
  ];

  const addTag = () => {
    if (tagInput.trim() && !customTags.includes(tagInput.trim()) && customTags.length < 10) {
      setCustomTags([...customTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const uploadToBunnyStream = async (file: File, title: string): Promise<{
    videoId: string;
    hlsUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
  }> => {
    console.log('Using Library ID:', BUNNY_STREAM_LIBRARY_ID);
    console.log('Using Access Key:', BUNNY_STREAM_ACCESS_KEY ? 'Present' : 'Missing');

    try {
      // Step 1: Create video object in Bunny Stream
      const createResponse = await fetch(`${BUNNY_STREAM_API_URL}/${BUNNY_STREAM_LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_ACCESS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create video: ${createResponse.status} - ${errorText}`);
      }

      const videoData = await createResponse.json();
      const videoId = videoData.guid;

      // Step 2: Upload video file with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 80); // Reserve 20% for final processing
            setUploadProgress(progress);
          }
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadProgress(100);
            resolve({
              videoId,
              hlsUrl: `${BUNNY_STREAM_CDN_URL}/${videoId}/playlist.m3u8`,
              thumbnailUrl: `${BUNNY_STREAM_CDN_URL}/${videoId}/thumbnail.jpg`,
              previewUrl: `${BUNNY_STREAM_CDN_URL}/${videoId}/preview.webp`,
            });
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status} - ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed due to network error'));

        xhr.open('PUT', `${BUNNY_STREAM_API_URL}/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`);
        xhr.setRequestHeader('AccessKey', BUNNY_STREAM_ACCESS_KEY);
        xhr.send(file);
      });
    } catch (error) {
      console.error('Bunny Stream upload error:', error);
      throw error;
    }
  };

  const isValidVideoUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv'];
      const pathname = urlObj.pathname.toLowerCase();
      return validExtensions.some(ext => pathname.endsWith(ext)) || 
             url.includes('youtube.com') || 
             url.includes('youtu.be') || 
             url.includes('vimeo.com') ||
             url.includes('bunnycdn.net') ||
             url.includes('cloudfront.net');
    } catch {
      return false;
    }
  };

  const generateThumbnailFromUrl = (videoUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(5, video.duration / 2);
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      video.onerror = () => reject(new Error('Error loading video from URL'));
      video.src = videoUrl;
    });
  };

  const generateThumbnail = (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(5, video.duration / 2); // Capture at 5 seconds or middle
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      video.onerror = () => reject(new Error('Error loading video'));
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadMethod === 'file' && !file) {
      toast({
        title: 'Missing Information',
        description: 'Please select a video file.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMethod === 'url' && (!videoUrl.trim() || !isValidVideoUrl(videoUrl))) {
      toast({
        title: 'Invalid URL',
        description: 'Please provide a valid video URL.',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim() || !category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filenames
      const timestamp = Date.now();
      let finalVideoUrl = '';

      let thumbnailUrl = '';
      let previewUrl = '';

      if (uploadMethod === 'file' && file) {
        // Upload video to Bunny Stream
        setUploadProgress(20);
        const streamData = await uploadToBunnyStream(file, title.trim());
        finalVideoUrl = streamData.hlsUrl;
        thumbnailUrl = streamData.thumbnailUrl;
        previewUrl = streamData.previewUrl;
        setUploadProgress(60);

        // Save video metadata using the same service as UploadPage
        const allTags = [category, ...customTags];
        const videoData = {
          owner_id: user?.id,
          title: title.trim(),
          description: description.trim() || undefined,
          video_url: finalVideoUrl,
          thumbnail_url: thumbnailUrl,
          preview_url: previewUrl,
          duration: '00:00', // This would be calculated from the actual video
          tags: allTags,
          is_premium: isPremium,
          is_moment: false
        };

        console.log('Attempting to save video with data:', videoData);

        try {
          console.log('Calling uploadVideo service with data:', videoData);

          if (typeof uploadVideo !== 'function') {
            throw new Error('uploadVideo service is not available or not imported correctly');
          }

          const savedVideo = await uploadVideo(videoData);
          console.log('Video saved successfully:', savedVideo);

          if (!savedVideo) {
            throw new Error('Failed to save video metadata - no response from server');
          }
        } catch (serviceError) {
          console.error('Video service error details:', serviceError);
          console.error('Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack trace');

          let errorMessage = 'Failed to save video';
          if (serviceError instanceof Error) {
            errorMessage += `: ${serviceError.message}`;
          } else if (typeof serviceError === 'string') {
            errorMessage += `: ${serviceError}`;
          } else {
            errorMessage += `: ${JSON.stringify(serviceError)}`;
          }

          throw new Error(errorMessage);
        }
      } else if (uploadMethod === 'url') {
        // For URL uploads, use the provided URL directly (not Stream processing)
        setUploadProgress(20);
        finalVideoUrl = videoUrl.trim();

        // Generate thumbnail for URL uploads
        try {
          const thumbnailBlob = await generateThumbnailFromUrl(finalVideoUrl);
          const thumbnailFilename = `thumbnails/${timestamp}_thumbnail.jpg`;
          // Upload thumbnail to CDN storage for URL-based videos
          const response = await fetch(`https://storage.bunnycdn.com/hubx-storage/${thumbnailFilename}`, {
            method: 'PUT',
            headers: {
              'AccessKey': BUNNY_STREAM_ACCESS_KEY,
              'Content-Type': 'image/jpeg',
            },
            body: thumbnailBlob,
          });
          if (response.ok) {
            thumbnailUrl = `${BUNNY_STREAM_CDN_URL}/${thumbnailFilename}`;
          }
        } catch (error) {
          console.warn('Failed to generate thumbnail for URL upload:', error);
        }
        setUploadProgress(60);

        // Save video metadata using the same service as UploadPage
        const allTags = [category, ...customTags];
        const videoData = {
          owner_id: user?.id,
          title: title.trim(),
          description: description.trim() || undefined,
          video_url: finalVideoUrl,
          thumbnail_url: thumbnailUrl,
          preview_url: previewUrl,
          duration: '00:00', // This would be calculated from the actual video
          tags: allTags,
          is_premium: isPremium,
          is_moment: false
        };

        console.log('Attempting to save video with data:', videoData);

        try {
          console.log('Calling uploadVideo service with data:', videoData);

          if (typeof uploadVideo !== 'function') {
            throw new Error('uploadVideo service is not available or not imported correctly');
          }

          const savedVideo = await uploadVideo(videoData);
          console.log('Video saved successfully:', savedVideo);

          if (!savedVideo) {
            throw new Error('Failed to save video metadata - no response from server');
          }
        } catch (serviceError) {
          console.error('Video service error details:', serviceError);
          console.error('Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack trace');

          let errorMessage = 'Failed to save video';
          if (serviceError instanceof Error) {
            errorMessage += `: ${serviceError.message}`;
          } else if (typeof serviceError === 'string') {
            errorMessage += `: ${serviceError}`;
          } else {
            errorMessage += `: ${JSON.stringify(serviceError)}`;
          }

          throw new Error(errorMessage);
        }
      }

      setUploadProgress(100);

      toast({
        title: 'Upload Successful',
        description: `Your video "${title}" has been uploaded successfully!`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setCustomTags([]);
      setTagInput('');
      setIsPremium(false);
      setFile(null);
      setThumbnailFile(null);
      setVideoUrl('');
      setUploadMethod('file');
      onVideoAdded();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Upload Video to HubX</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Method *</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="file-upload"
                  name="uploadMethod"
                  value="file"
                  checked={uploadMethod === 'file'}
                  onChange={() => {
                    setUploadMethod('file');
                    setVideoUrl('');
                  }}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="file-upload" className="text-sm">File Upload</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="url-upload"
                  name="uploadMethod"
                  value="url"
                  checked={uploadMethod === 'url'}
                  onChange={() => {
                    setUploadMethod('url');
                    setFile(null);
                  }}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="url-upload" className="text-sm">URL Upload</Label>
              </div>
            </div>
          </div>

          {/* Video File Upload */}
          {uploadMethod === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="videoFile" className="text-sm font-medium">
                Video File *
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="videoFile" className="cursor-pointer">
                  <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    {file ? file.name : 'Click to select a video file'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supported formats: MP4, AVI, MOV, WMV (Max: 2GB)
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Video URL Upload */}
          {uploadMethod === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-sm font-medium">
                Video URL *
              </Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Supported: Direct video URLs (.mp4, .avi, .mov, .wmv, .webm), YouTube, Vimeo, CDN URLs
              </p>
              {videoUrl && !isValidVideoUrl(videoUrl) && (
                <p className="text-xs text-red-500">
                  Please enter a valid video URL
                </p>
              )}
            </div>
          )}

          {/* Thumbnail Upload (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="thumbnailFile" className="text-sm font-medium">
              Custom Thumbnail (Optional)
            </Label>
            <Input
              id="thumbnailFile"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            <p className="text-xs text-gray-500">
              If not provided, a thumbnail will be auto-generated from your video
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Video Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title for your video"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">{title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your video content..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">{description.length}/1000 characters</p>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Tags</Label>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag (press Enter)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                maxLength={20}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {customTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Add up to 10 tags to help users discover your content
            </p>
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
            <Star className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <Label htmlFor="premium" className="text-sm font-medium flex items-center space-x-2">
                <span>Premium Content</span>
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Mark this video as premium content (requires subscription to view)
              </p>
            </div>
            <Switch
              id="premium"
              checked={isPremium}
              onCheckedChange={setIsPremium}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              uploading || 
              !title.trim() || 
              !category || 
              (uploadMethod === 'file' && !file) || 
              (uploadMethod === 'url' && (!videoUrl.trim() || !isValidVideoUrl(videoUrl)))
            }
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;