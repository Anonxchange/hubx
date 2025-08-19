
import { supabase } from '@/integrations/supabase/client';

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

  // Generate Bunny CDN preview URLs with time ranges
  static generateBunnyPreviewUrl(videoUrl: string, startTime: number, duration: number = 10): string {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      // Use Bunny CDN's time-based seeking
      return `${videoUrl}#t=${startTime},${startTime + duration}`;
    }
    return `${videoUrl}#t=${startTime}`;
  }

  // Optimize preview loading based on bandwidth
  static shouldUsePreview(connectionType: string): boolean {
    const lowBandwidthTypes = ['slow-2g', '2g'];
    return !lowBandwidthTypes.includes(connectionType);
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
}

export default VideoPreviewService;
