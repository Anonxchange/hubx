
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

  // Generate intelligent preview timestamps based on video duration
  static generatePreviewTimestamps(durationString: string): number[] {
    const [minutes, seconds] = durationString.split(':').map(Number);
    const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
    
    // Generate 5 preview points distributed throughout the video
    if (totalSeconds <= 60) {
      // Short video - preview every 10-15 seconds
      return [5, 15, 30, 45].filter(t => t < totalSeconds - 5);
    } else if (totalSeconds <= 300) {
      // Medium video (up to 5 min) - preview every minute or so
      return [10, 60, 120, 180, 240].filter(t => t < totalSeconds - 10);
    } else {
      // Long video - preview at 10%, 25%, 50%, 75%, 90% marks
      const marks = [0.1, 0.25, 0.5, 0.75, 0.9];
      return marks.map(mark => Math.floor(totalSeconds * mark));
    }
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
      // Add quality parameters for Bunny CDN
      const qualityParams = quality === 'low' ? '&width=480&height=270' : 
                           quality === 'medium' ? '&width=720&height=405' : '';
      
      // Use Bunny CDN's time-based seeking with quality control
      return `${videoUrl}?t=${startTime}&duration=${duration}${qualityParams}`;
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

  // Generate and upload WebP previews to Bunny CDN
  static async generateAndUploadWebPPreviews(
    videoId: string,
    videoUrl: string,
    duration: string,
    userId: string
  ): Promise<string[]> {
    const timestamps = this.generatePreviewTimestamps(duration);
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      
      try {
        // Generate WebP preview
        const webpBlob = await this.generateWebPPreview(videoUrl, timestamp, {
          width: 480,
          height: 270,
          quality: 0.7 // Lower quality for previews
        });
        
        if (webpBlob) {
          // Create a file from the blob
          const filename = `preview_${videoId}_${timestamp}.webp`;
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
        console.error(`Failed to generate preview for timestamp ${timestamp}:`, error);
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

  // Get WebP preview URL for specific timestamp
  static getWebPPreviewUrl(videoId: string, timestamp: number, userId: string): string {
    const BUNNY_CDN_URL = 'https://hubx.b-cdn.net';
    return `${BUNNY_CDN_URL}/previews/${userId}/preview_${videoId}_${timestamp}.webp`;
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
