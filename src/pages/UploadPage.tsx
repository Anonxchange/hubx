import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
import { uploadVideo } from '@/services/videosService';

const categories = [
  '18-25', '60FPS', 'Amateur', 'Anal', 'Arab', 'Asian', 'Babe', 'Babysitter (18+)', 
  'BBW', 'Behind The Scenes', 'Big Ass', 'Big Dick', 'Big Tits', 'Blonde', 'Blowjob', 
  'Bondage', 'Brazilian', 'British', 'Brunette', 'Cartoon', 'Casting', 'College (18+)', 
  'Compilation', 'Cosplay', 'Creampie', 'Cumshot', 'Czech', 'Double Penetration', 
  'Ebony', 'Euro', 'Exclusive', 'Feet', 'Female Orgasm', 'Fetish', 'Fingering', 
  'Fisting', 'French', 'Funny', 'Gaming', 'Gangbang', 'German', 'Handjob', 'Hardcore', 
  'HD Porn', 'Hentai', 'Indian', 'Interactive', 'Interracial', 'Italian', 'Japanese', 
  'Korean', 'Latina', 'Lesbian', 'Massage', 'Masturbation', 'Mature', 'MILF', 'Music', 
  'Muscular Men', 'Old/Young (18+)', 'Orgy', 'Parody', 'Party', 'Pissing', 'Podcast', 
  'Popular With Women', 'Pornstar', 'POV', 'Public', 'Pussy Licking', 'Reality', 
  'Red Head', 'Role Play', 'Romantic', 'Rough Sex', 'Russian', 'School (18+)', 'SFW', 
  'Small Tits', 'Smoking', 'Solo Female', 'Solo Male', 'Squirt', 'Step Fantasy', 
  'Strap On', 'Striptease', 'Tattooed Women', 'Threesome', 'Toys', 'Transgender', 
  'Verified Amateurs', 'Verified Couples', 'Verified Models', 'Vintage', 'Virtual Reality', 
  'Webcam'
];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState('00:00');
  const [isMultipleUpload, setIsMultipleUpload] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const isStudioUser = userType === 'studio_creator';

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isMoment, setIsMoment] = useState(false);

  // User role check
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
          <Button onClick={() => navigate('/become-creator')}>
            Become a Creator
          </Button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Filter for video files only
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      toast({ title: "Invalid file type", description: "Please select video files only.", variant: "destructive" });
      return;
    }

    // Check file sizes (25GB limit)
    const oversizedFiles = videoFiles.filter(file => file.size > 25 * 1024 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({ 
        title: "File too large", 
        description: `${oversizedFiles.length} file(s) exceed the 25GB limit.`, 
        variant: "destructive" 
      });
      return;
    }

    if (isMultipleUpload) {
      setSelectedFiles(videoFiles);
      // Set preview to first file
      if (videoFiles.length > 0) {
        setPreviewUrl(URL.createObjectURL(videoFiles[0]));
        extractDuration(videoFiles[0]);
      }
    } else {
      const file = videoFiles[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      extractDuration(file);
    }
  };

  const extractDuration = (file: File) => {
    const tempVideo = document.createElement('video');
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      const mins = Math.floor(tempVideo.duration / 60);
      const secs = Math.floor(tempVideo.duration % 60);
      setDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      
      // Check if video is too long for moments
      if (isMoment && tempVideo.duration > 900) {
        toast({ 
          title: "Video too long for moments", 
          description: "Moments must be 15 minutes or less. Uncheck 'Upload as Moment' or choose a shorter video.", 
          variant: "destructive" 
        });
      }
    };
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;
    
    // Create a mock event for handleFileSelect
    const mockEvent = {
      target: { files: files }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleFileSelect(mockEvent);
  };

  const removeFile = (index: number) => {
    if (isMultipleUpload) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      
      // Update preview if removing the first file
      if (index === 0 && newFiles.length > 0) {
        setPreviewUrl(URL.createObjectURL(newFiles[0]));
        extractDuration(newFiles[0]);
      } else if (newFiles.length === 0) {
        setPreviewUrl('');
        setDuration('00:00');
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl('');
      setDuration('00:00');
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
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
    const value = tagInput.trim();
    if (value && !customTags.includes(value) && customTags.length < 10) {
      setCustomTags([...customTags, value]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setCustomTags(customTags.filter(t => t !== tag));

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const uploadToBunnyStream = async (file: File) => {
    // Hardcode the credentials since env variables aren't loading properly
    const BUNNY_STREAM_LIBRARY_ID = '476242';
    const BUNNY_STREAM_ACCESS_KEY = 'f6fc4579-a3e4-484d-8387361ef995-6653-4a7b';
    
    // Use your specific CDN URL
    const cdnUrl = 'https://vz-a3bd9097-45c.b-cdn.net';

    console.log('Using Library ID:', BUNNY_STREAM_LIBRARY_ID);
    console.log('Using Access Key:', BUNNY_STREAM_ACCESS_KEY ? 'Present' : 'Missing');

    try {
      // Create video in Bunny Stream
      const createResp = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_ACCESS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title || file.name }),
      });

      if (!createResp.ok) {
        const errorText = await createResp.text();
        throw new Error(`Failed to create video: ${createResp.status} - ${errorText}`);
      }

      const videoData = await createResp.json();
      const videoId = videoData.guid;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 80));
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadProgress(100);
            resolve({
              videoId,
              hlsUrl: `${cdnUrl}/${videoId}/playlist.m3u8`,
              thumbnailUrl: `${cdnUrl}/${videoId}/thumbnail.jpg`,
              previewUrl: `${cdnUrl}/${videoId}/preview.webp`,
            });
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status} - ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed due to network error'));
        xhr.open('PUT', `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`);
        xhr.setRequestHeader('AccessKey', BUNNY_STREAM_ACCESS_KEY);
        xhr.send(file);
      });
    } catch (error) {
      console.error('Bunny Stream upload error:', error);
      throw error;
    }
  };

  const uploadSingleVideo = async (file: File, videoTitle: string) => {
    const streamData = await uploadToBunnyStream(file);
    const allTags = [...selectedCategories, ...customTags];
    
    const videoData = {
      owner_id: user.id,
      title: videoTitle.trim(),
      description: description.trim() || undefined,
      video_url: streamData.hlsUrl,
      thumbnail_url: streamData.thumbnailUrl,
      preview_url: streamData.previewUrl,
      duration: '00:00', // Would need to calculate from actual file
      tags: allTags,
      is_premium: isPremium,
      is_moment: isMoment
    };

    return await uploadVideo(videoData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasFiles = isMultipleUpload ? selectedFiles.length > 0 : selectedFile;
    const filesToUpload = isMultipleUpload ? selectedFiles : (selectedFile ? [selectedFile] : []);
    
    if (!hasFiles || !title.trim() || selectedCategories.length === 0) {
      toast({ 
        title: "Missing required fields", 
        description: "Fill all required fields including at least one category.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    setUploadedCount(0);
    setFailedCount(0);
    
    try {
      const totalFiles = filesToUpload.length;
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentUploadIndex(i);
        
        // For multiple files, append index to title
        const videoTitle = totalFiles > 1 ? `${title} - Part ${i + 1}` : title;
        
        const progress = Math.round((i / totalFiles) * 80);
        setUploadProgress(progress);
        
        try {
          await uploadSingleVideo(file, videoTitle);
          setUploadedCount(prev => prev + 1);
        } catch (error) {
          console.error(`Failed to upload file ${i + 1}:`, error);
          setFailedCount(prev => prev + 1);
        }
      }
      
      setUploadProgress(100);
      
      const successMessage = totalFiles > 1 
        ? `${uploadedCount} of ${totalFiles} videos uploaded successfully!` 
        : "Video uploaded successfully!";
        
      toast({ 
        title: "Upload completed!", 
        description: failedCount > 0 ? `${successMessage} ${failedCount} failed.` : successMessage 
      });

      // Reset form
      setSelectedFile(null);
      setSelectedFiles([]);
      setPreviewUrl('');
      setTitle('');
      setDescription('');
      setSelectedCategories([]);
      setCustomTags([]);
      setTagInput('');
      setIsPremium(false);
      setIsMoment(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
      setUploadedCount(0);
      setFailedCount(0);
      setDuration('00:00');

      setTimeout(() => {
        if (userType === 'studio_creator') navigate('/studio-dashboard');
        else navigate('/creator-dashboard');
      }, 1500);

    } catch (err) {
      toast({ 
        title: "Upload failed", 
        description: err instanceof Error ? err.message : "Error uploading videos.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">HubX</span>
            <Badge variant="secondary">Upload Content</Badge>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline" size="sm">Back</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Upload to HubX</h1>
        <p className="text-muted-foreground text-center mb-8">Share your content and start earning - videos will appear in your dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Video Upload
                    {isStudioUser && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isMultipleUpload}
                          onCheckedChange={(checked) => {
                            setIsMultipleUpload(checked);
                            // Reset files when switching modes
                            setSelectedFile(null);
                            setSelectedFiles([]);
                            setPreviewUrl('');
                            setDuration('00:00');
                          }}
                        />
                        <Label className="text-sm">Multiple Upload</Label>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(!selectedFile && selectedFiles.length === 0) ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        Upload your video{isMultipleUpload ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to select</p>
                      <p className="text-xs text-muted-foreground">
                        Formats: MP4, AVI, MOV, WMV (Max 25GB each)
                        {isMultipleUpload && ' • Select multiple files'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {previewUrl && (
                        <div className="relative">
                          <video
                            ref={videoRef}
                            src={previewUrl}
                            className="w-full h-64 object-cover rounded-lg"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            controls={false}
                          />
                          <div className="absolute inset-0 flex items-center justify-center space-x-2">
                            <Button type="button" onClick={togglePlay} size="sm" variant="secondary">
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button type="button" onClick={toggleMute} size="sm" variant="secondary">
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {isMultipleUpload ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{selectedFiles.length} files selected</span>
                            <Button
                              type="button"
                              onClick={() => { setSelectedFiles([]); setPreviewUrl(''); setDuration('00:00'); }}
                              size="sm"
                              variant="outline"
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm truncate">
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <Button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : selectedFile && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) - {duration}
                          </span>
                          <Button
                            type="button"
                            onClick={() => removeFile(0)}
                            size="sm"
                            variant="outline"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple={isMultipleUpload}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {isUploading && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {isMultipleUpload 
                            ? `Uploading file ${currentUploadIndex + 1} of ${selectedFiles.length}...`
                            : 'Uploading...'
                          }
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      {isMultipleUpload && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Completed: {uploadedCount}</span>
                          <span>Failed: {failedCount}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Video Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter video title"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-muted-foreground">{title.length}/100</p>
                  </div>

                  <div>
                    <Label>Categories * (Select at least one)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                      {categories.map((category) => (
                        <div
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`
                            px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
                            ${selectedCategories.includes(category)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                            }
                          `}
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCategories.map((category) => (
                          <Badge key={category} variant="secondary" className="cursor-pointer" onClick={() => toggleCategory(category)}>
                            {category} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedCategories.length} categories selected
                    </p>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your video..."
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{description.length}/500</p>
                  </div>

                  <div>
                    <Label>Custom Tags</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add custom tags"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addCustomTag} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customTags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                    <Label>Premium Content</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={isMoment} 
                      onCheckedChange={setIsMoment}
                      disabled={selectedFile && duration !== '00:00' && duration.split(':')[0] !== '00' && (parseInt(duration.split(':')[0]) > 15 || (parseInt(duration.split(':')[0]) === 15 && parseInt(duration.split(':')[1]) > 0))}
                    />
                    <Label>Upload as Moment (Max 15 minutes)</Label>
                  </div>
                  {isMoment && (
                    <p className="text-xs text-muted-foreground">
                      Moments are short-form videos that appear in the Moments feed. Maximum duration: 15 minutes.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                <Button
                  type="submit"
                  disabled={
                    (isMultipleUpload ? selectedFiles.length === 0 : !selectedFile) || 
                    !title.trim() || 
                    selectedCategories.length === 0 || 
                    isUploading
                  }
                  className="flex-1"
                >
                  {isUploading 
                    ? (isMultipleUpload ? `Uploading ${currentUploadIndex + 1} of ${selectedFiles.length}...` : 'Uploading...') 
                    : (isMultipleUpload ? `Upload ${selectedFiles.length} Videos` : 'Upload Video')
                  }
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