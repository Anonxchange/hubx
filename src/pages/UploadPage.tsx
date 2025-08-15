import React, { useState, useRef } from 'react';
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
  '18-25', '60FPS', 'Amateur', 'Anal', 'Arab', 'Asian', 'Babe', 'BBW', 'Blonde', 'Blowjob',
  'Bondage', 'Brazilian', 'British', 'Brunette', 'Cartoon', 'Casting', 'College (18+)',
  'Compilation', 'Cosplay', 'Creampie', 'Cumshot', 'Czech', 'Double Penetration', 'Ebony',
  'Euro', 'Exclusive', 'Feet', 'Female Orgasm', 'Fetish', 'Fingering', 'Fisting', 'French',
  'Funny', 'Gaming', 'Gangbang', 'German', 'Handjob', 'Hardcore', 'HD Porn', 'Hentai',
  'Indian', 'Interactive', 'Interracial', 'Italian', 'Japanese', 'Korean', 'Latina', 'Lesbian',
  'Massage', 'Masturbation', 'Mature', 'MILF', 'Music', 'Muscular Men', 'Old/Young (18+)',
  'Orgy', 'Parody', 'Party', 'Pissing', 'Podcast', 'Popular With Women', 'Pornstar', 'POV',
  'Public', 'Pussy Licking', 'Reality', 'Red Head', 'Role Play', 'Romantic', 'Rough Sex',
  'Russian', 'School (18+)', 'SFW', 'Small Tits', 'Smoking', 'Solo Female', 'Solo Male',
  'Squirt', 'Step Fantasy', 'Strap On', 'Striptease', 'Tattooed Women', 'Threesome', 'Toys',
  'Transgender', 'Verified Amateurs', 'Verified Couples', 'Verified Models', 'Vintage',
  'Virtual Reality', 'Webcam'
];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);

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
          <p className="text-muted-foreground mb-6">Only verified creators can upload content.</p>
          <Button onClick={() => navigate('/become-creator')}>Become a Creator</Button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) return toast({ title: "Invalid file", variant: "destructive" });
    if (file.size > 500 * 1024 * 1024) return toast({ title: "Max 500MB allowed", variant: "destructive" });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) return toast({ title: "Invalid file", variant: "destructive" });
    if (file.size > 500 * 1024 * 1024) return toast({ title: "Max 500MB allowed", variant: "destructive" });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const addCustomTag = () => {
    const value = tagInput.trim();
    if (!value || customTags.includes(value) || customTags.length >= 10) return;
    setCustomTags([...customTags, value]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setCustomTags(customTags.filter(t => t !== tag));

  const uploadToBunnyStream = async (file: File) => {
    const LIB_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '';
    const ACCESS_KEY = import.meta.env.VITE_BUNNY_STREAM_ACCESS_KEY || '';
    if (!LIB_ID || !ACCESS_KEY) throw new Error('Bunny Stream credentials missing');

    const libResp = await fetch(`https://video.bunnycdn.com/library/${LIB_ID}`, { headers: { AccessKey: ACCESS_KEY } });
    if (!libResp.ok) throw new Error('Failed to fetch library');
    const { cdnUrl } = await libResp.json();

    const createResp = await fetch(`https://video.bunnycdn.com/library/${LIB_ID}/videos`, {
      method: 'POST',
      headers: { AccessKey: ACCESS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || file.name }),
    });
    if (!createResp.ok) throw new Error('Failed to create video');
    const { guid: videoId } = await createResp.json();

    return new Promise<{ videoId: string; hlsUrl: string; thumbnailUrl: string; previewUrl: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', e => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 80)); });
      xhr.onload = () => xhr.status === 200 ? resolve({ videoId, hlsUrl: `${cdnUrl}/${videoId}/playlist.m3u8`, thumbnailUrl: `${cdnUrl}/${videoId}/thumbnail.jpg`, previewUrl: `${cdnUrl}/${videoId}/preview.webp` }) : reject(new Error(`Upload failed: ${xhr.status}`));
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('PUT', `https://video.bunnycdn.com/library/${LIB_ID}/videos/${videoId}`);
      xhr.setRequestHeader('AccessKey', ACCESS_KEY);
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim() || !selectedCategory) return toast({ title: "Fill all required fields", variant: "destructive" });
    setIsUploading(true);

    try {
      setUploadProgress(20);
      const streamData = await uploadToBunnyStream(selectedFile);
      setUploadProgress(80);
      const videoData = { title, description: description || undefined, video_url: streamData.hlsUrl, thumbnail_url: streamData.thumbnailUrl, preview_url: streamData.previewUrl, duration: '00:00', tags: [selectedCategory, ...customTags], is_premium: isPremium, is_moment: false };
      const savedVideo = await uploadVideo(videoData);
      if (!savedVideo) throw new Error('Failed to save metadata');
      setUploadProgress(100);
      toast({ title: "Upload successful!", description: "Video is live." });

      setSelectedFile(null); setPreviewUrl(''); setTitle(''); setDescription(''); setSelectedCategory(''); setCustomTags([]); setTagInput(''); setIsPremium(false); setUploadProgress(0);

      setTimeout(() => userType === 'studio_creator' ? navigate('/studio-dashboard') : navigate('/creator-dashboard'), 1500);
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Error uploading video.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4"><span className="text-xl font-bold">HubX</span><Badge variant="secondary">Upload Content</Badge></div>
          <Button onClick={() => navigate(-1)} variant="outline" size="sm">Back</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Upload to HubX</h1>
        <p className="text-muted-foreground text-center mb-8">Share your content and start earning.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Video Upload</CardTitle></CardHeader>
                <CardContent>
                  {!selectedFile ? (
                    <div className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary" onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Upload your video</p>
                      <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to select</p>
                      <p className="text-xs text-muted-foreground">Formats: MP4, AVI, MOV, WMV (Max 500MB)</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <video ref={videoRef} src={previewUrl} className="w-full h-64 object-cover rounded-lg" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} controls={false} />
                        <div className="absolute inset-0 flex items-center justify-center space-x-2">
                          <Button type="button" onClick={togglePlay} size="sm" variant="secondary">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
                          <Button type="button" onClick={toggleMute} size="sm" variant="secondary">{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <Button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(''); }} size="sm" variant="outline"><X className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                </CardContent>
              </Card>

              {isUploading && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between text-sm mb-2"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                    <div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${uploadProgress}%` }} /></div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Video Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter video title" maxLength={100} required />
                    <p className="text-xs text-muted-foreground">{title.length}/100</p>
                  </div>

                  <div>
                    <Label>Category *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your video..." maxLength={500} />
                    <p className="text-xs text-muted-foreground">{description.length}/500</p>
                  </div>

                  <div>
                    <Label>Custom Tags</Label>
                    <div className="flex space-x-2">
                      <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add custom tags" onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); }}} />
                      <Button type="button" onClick={addCustomTag} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">{customTags.map((tag, i) => <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag} <X className="w-3 h-3 ml-1" /></Badge>)}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                    <Label>Premium Content</Label>
                  </div>
                </CardContent>
              </Card>

              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={!selectedFile || !title.trim() || !selectedCategory || isUploading} className="flex-1">{isUploading ? 'Uploading...' : 'Upload Video'}</Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;