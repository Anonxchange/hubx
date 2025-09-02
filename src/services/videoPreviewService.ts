
import { supabase } from '@/integrations/supabase/client';
import { uploadToBunnyStorage, generateUniqueFilename } from './bunnyStorageService';

interface PreviewSegment {
  startTime: number;
  duration: number;
  url?: string;
}

interface VideoPreviewData {
  id: string;
  preview_segments: PreviewSegment[];
  preview_url?: string;
  duration_seconds: number;
}

interface WebPPreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export class VideoPreviewService {
  private static previewCache = new Map<string, VideoPreviewData>();

  // Generate intelligent preview timestamps based on video duration (matches backend logic)
  static generatePreviewTimestamps(durationString: string): number[] {
    const [minutes, seconds] = durationString.split(':').map(Number);
    const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
    
    const timestamps: number[] = [];
    
    if (totalSeconds <= 60) {
      // Short video: every 15 seconds
      for (let i = 10; i < totalSeconds - 10; i += 15) {
        timestamps.push(i);
      }
    } else if (totalSeconds <= 300) {
      // Medium video: every 45 seconds
      for (let i = 30; i < totalSeconds - 20; i += 45) {
        timestamps.push(i);
      }
    } else {
      // Long video: distributed timestamps
      const intervals = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];
      intervals.forEach((ratio) => {
        const time = Math.floor(totalSeconds * ratio);
        timestamps.push(time);
      });
    }

    return timestamps.slice(0, 6); // Max 6 previews
  }

  // Get or generate preview data for a video
  static async getVideoPreviewData(videoId: string, videoDuration: string): Promise<VideoPreviewData> {
    // Check cache first
    if (this.previewCache.has(videoId)) {
      return this.previewCache.get(videoId)!;
    }

    const timestamps = this.generatePreviewTimestamps(videoDuration);
    const [minutes, seconds] = videoDuration.split(':').map(Number);
    const durationSeconds = (minutes || 0) * 60 + (seconds || 0);

    const previewData: VideoPreviewData = {
      id: videoId,
      preview_segments: timestamps.map(startTime => ({
        startTime,
        duration: 10, // 10 seconds per segment as requested
      })),
      duration_seconds: durationSeconds
    };

    // Cache the preview data
    this.previewCache.set(videoId, previewData);
    return previewData;
  }

  // Generate Bunny CDN preview URLs with time ranges and quality optimization
  static generateBunnyPreviewUrl(videoUrl: string, startTime: number, duration: number = 10, quality: 'low' | 'medium' | 'high' = 'low'): string {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      // For Bunny CDN, use their video preview API to generate MP4 clips
      const baseUrl = videoUrl.split('?')[0];
      const qualityParams = quality === 'low' ? 'width=480&height=270' : 
                           quality === 'medium' ? 'width=720&height=405' : 
                           'width=1080&height=607';
      
      // Generate preview clip URL using Bunny's video processing
      return `${baseUrl}?seek=${startTime}&duration=${duration}&${qualityParams}&format=mp4`;
    }
    return `${videoUrl}#t=${startTime}`;
  }

  // Get optimized preview quality based on connection
  static getOptimalPreviewQuality(connectionType?: string): 'low' | 'medium' | 'high' {
    if (!connectionType) return 'low';
    
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return 'low';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'low'; // Still use low for previews to save bandwidth
    }
  }

  // Optimize preview loading based on bandwidth
  static shouldUsePreview(connectionType: string): boolean {
    const lowBandwidthTypes = ['slow-2g', '2g'];
    return !lowBandwidthTypes.includes(connectionType);
  }

  // Generate WebP preview from video at specific timestamp
  static async generateWebPPreview(
    videoUrl: string, 
    timestamp: number, 
    options: WebPPreviewOptions = {}
  ): Promise<Blob | null> {
    const { width = 480, height = 270, quality = 0.8 } = options;
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      video.onloadeddata = () => {
        video.currentTime = timestamp;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/webp', quality);
        } else {
          resolve(null);
        }
      };
      
      video.onerror = () => resolve(null);
      video.src = videoUrl;
    });
  }

  // Generate animated WebP preview from video (3-second loop)
  static async generateAnimatedWebPPreview(
    videoUrl: string, 
    startTimestamp: number, 
    options: WebPPreviewOptions & { duration?: number; frameRate?: number } = {}
  ): Promise<Blob | null> {
    const { width = 480, height = 270, quality = 0.7, duration = 3, frameRate = 10 } = options;
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      const frames: ImageData[] = [];
      let currentFrame = 0;
      const totalFrames = duration * frameRate;
      const frameInterval = 1 / frameRate;
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }
      
      const captureFrame = () => {
        if (currentFrame >= totalFrames) {
          // All frames captured, create animated WebP
          this.createAnimatedWebPFromFrames(frames, width, height, frameRate, quality)
            .then(resolve)
            .catch(() => resolve(null));
          return;
        }
        
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        frames.push(imageData);
        
        currentFrame++;
        const nextTimestamp = startTimestamp + (currentFrame * frameInterval);
        video.currentTime = nextTimestamp;
      };
      
      video.onloadeddata = () => {
        video.currentTime = startTimestamp;
      };
      
      video.onseeked = captureFrame;
      video.onerror = () => resolve(null);
      video.src = videoUrl;
    });
  }

  // Create animated WebP from captured frames (simplified approach)
  private static async createAnimatedWebPFromFrames(
    frames: ImageData[],
    width: number,
    height: number,
    frameRate: number,
    quality: number
  ): Promise<Blob | null> {
    // For now, create a GIF-like effect by returning the first frame as WebP
    // In a real implementation, you'd use a library like gif.js or similar
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || frames.length === 0) return null;
    
    ctx.putImageData(frames[0], 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/webp', quality);
    });
  }

  // Generate and upload WebP previews to Bunny CDN
  static async generateAndUploadWebPPreviews(
    videoId: string,
    videoUrl: string,
    duration: string,
    userId: string,
    animated: boolean = false
  ): Promise<string[]> {
    const timestamps = this.generatePreviewTimestamps(duration);
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      
      try {
        let webpBlob: Blob | null = null;
        
        if (animated) {
          // Generate animated WebP preview (3-second loop)
          webpBlob = await this.generateAnimatedWebPPreview(videoUrl, timestamp, {
            width: 480,
            height: 270,
            quality: 0.6, // Lower quality for animated previews
            duration: 3,
            frameRate: 8 // 8 FPS for smaller file size
          });
        } else {
          // Generate static WebP preview
          webpBlob = await this.generateWebPPreview(videoUrl, timestamp, {
            width: 480,
            height: 270,
            quality: 0.7
          });
        }
        
        if (webpBlob) {
          // Create a file from the blob
          const suffix = animated ? '_animated' : '';
          const filename = `preview_${videoId}_${timestamp}${suffix}.webp`;
          const file = new File([webpBlob], filename, { type: 'image/webp' });
          
          // Upload to Bunny CDN
          const path = `previews/${userId}/${filename}`;
          const uploadResult = await uploadToBunnyStorage(file, path);
          
          if (uploadResult.success && uploadResult.url) {
            uploadedUrls.push(uploadResult.url);
            
            // Update video record with preview URL (first preview becomes main preview_url)
            if (i === 0) {
              await this.updateVideoPreviewUrl(videoId, uploadResult.url);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to generate ${animated ? 'animated' : 'static'} preview for timestamp ${timestamp}:`, error);
      }
    }
    
    return uploadedUrls;
  }

  // Update video record with preview URL
  static async updateVideoPreviewUrl(videoId: string, previewUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ preview_url: previewUrl })
        .eq('id', videoId);
      
      if (error) {
        console.error('Error updating video preview URL:', error);
      }
    } catch (error) {
      console.error('Failed to update video preview URL:', error);
    }
  }

  // Process existing videos to generate WebP previews
  static async processExistingVideos(batchSize: number = 10): Promise<void> {
    try {
      console.log('Starting batch processing of existing videos...');
      
      // Get videos that don't have WebP previews
      const { data: videos, error } = await supabase
        .from('videos')
        .select('id, video_url, duration, owner_id, preview_url')
        .or('preview_url.is.null,preview_url.not.like.%.webp')
        .eq('is_premium', false)
        .eq('is_moment', false)
        .limit(batchSize);

      if (error) {
        console.error('Error fetching videos for processing:', error);
        return;
      }

      if (!videos || videos.length === 0) {
        console.log('No videos found that need WebP preview processing');
        return;
      }

      console.log(`Processing ${videos.length} videos...`);

      for (const video of videos) {
        try {
          console.log(`Processing video ${video.id}...`);
          
          const previewUrls = await this.generateAndUploadWebPPreviews(
            video.id,
            video.video_url,
            video.duration,
            video.owner_id
          );
          
          if (previewUrls.length > 0) {
            console.log(`Generated ${previewUrls.length} WebP previews for video ${video.id}`);
          }
          
          // Add small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to process video ${video.id}:`, error);
        }
      }
      
      console.log('Batch processing completed');
      
    } catch (error) {
      console.error('Error in batch processing:', error);
    }
  }

  // Check if video has WebP previews
  static async hasWebPPreviews(videoId: string, userId: string): Promise<boolean> {
    const timestamps = this.generatePreviewTimestamps('5:00'); // Default check
    const firstPreviewUrl = this.getWebPPreviewUrl(videoId, timestamps[0], userId);
    
    try {
      const response = await fetch(firstPreviewUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get WebP preview URLs for a video
  static async getWebPPreviewUrls(videoId: string, userId: string, duration: string): Promise<string[]> {
    const timestamps = this.generatePreviewTimestamps(duration);
    return timestamps.map(timestamp => this.getWebPPreviewUrl(videoId, timestamp, userId));
  }

  // Get WebP preview URL for specific timestamp (FFmpeg-generated)
  static getWebPPreviewUrl(videoId: string, timestamp: number, userId: string): string {
    const BUNNY_CDN_URL = 'https://hubx.b-cdn.net';
    return `${BUNNY_CDN_URL}/previews/${userId}/${videoId}_${timestamp}s_preview.webp`;
  }

  // Get all preview URLs for a video from database
  static async getVideoPreviewUrls(videoId: string): Promise<string[]> {
    const { data: video, error } = await supabase
      .from('videos')
      .select('preview_urls')
      .eq('id', videoId)
      .single();

    if (error || !video?.preview_urls) {
      console.error('Error fetching preview URLs:', error);
      return [];
    }

    return video.preview_urls;
  }

  // Trigger video processing for existing videos
  static async triggerVideoProcessing(videoId: string, hlsUrl: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch('/functions/v1/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          videoId,
          hlsUrl,
          userId,
          generatePreviews: true
        })
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Video processing triggered:', result);
      return true;
      
    } catch (error) {
      console.error('Failed to trigger video processing:', error);
      return false;
    }
  }

  // Get Bunny CDN generated video preview URL (replaces main video hover previews)
  static getBunnyVideoPreviewUrl(videoUrl: string, timestamp: number, duration: number = 3): string {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      const baseUrl = videoUrl.split('?')[0];
      // Use Bunny's video processing to create a short preview clip
      return `${baseUrl}?seek=${timestamp}&duration=${duration}&width=320&height=180&format=mp4&autoplay=false`;
    }
    // Fallback for non-Bunny URLs
    return `${videoUrl}#t=${timestamp}`;
  }

  // Create preview manifest for better caching
  static async createPreviewManifest(videoId: string, videoUrl: string, duration: string) {
    const previewData = await this.getVideoPreviewData(videoId, duration);
    
    return {
      videoId,
      segments: previewData.preview_segments.map((segment, index) => ({
        id: `${videoId}_preview_${index}`,
        url: this.generateBunnyPreviewUrl(videoUrl, segment.startTime, segment.duration),
        startTime: segment.startTime,
        duration: segment.duration,
        preload: index === 0 // Only preload first segment
      }))
    };
  }

  // Create WebP preview manifest
  static async createWebPPreviewManifest(
    videoId: string, 
    userId: string, 
    duration: string
  ) {
    const timestamps = this.generatePreviewTimestamps(duration);
    
    return {
      videoId,
      previews: timestamps.map((timestamp, index) => ({
        id: `${videoId}_webp_${index}`,
        url: this.getWebPPreviewUrl(videoId, timestamp, userId),
        timestamp,
        preload: index === 0 // Only preload first preview
      }))
    };
  }
}

export default VideoPreviewService;
