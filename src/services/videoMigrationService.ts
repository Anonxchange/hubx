
import { supabase } from '@/integrations/supabase/client';

interface MigrationOptions {
  generateStatic: boolean;
  generateAnimated: boolean;
}

interface MigrationStatus {
  isProcessing: boolean;
  processed: number;
  total: number;
  completed: number;
  errors: number;
  estimatedTimeRemaining?: number;
}

class VideoMigrationService {
  private static migrationStatus: MigrationStatus = {
    isProcessing: false,
    processed: 0,
    total: 0,
    completed: 0,
    errors: 0
  };

  private static shouldStop = false;
  private static startTime: number = 0;

  static async migrateToWebPPreviews(
    options: MigrationOptions,
    progressCallback?: (processed: number, total: number) => void
  ) {
    try {
      this.shouldStop = false;
      this.startTime = Date.now();
      
      // Get all videos that need migration
      const { data: videos, error } = await supabase
        .from('videos')
        .select('id, title, video_url, preview_url')
        .not('video_url', 'is', null);

      if (error) throw error;

      const videosToMigrate = videos?.filter(video => 
        !video.preview_url || !video.preview_url.includes('.webp')
      ) || [];

      this.migrationStatus = {
        isProcessing: true,
        processed: 0,
        total: videosToMigrate.length,
        completed: 0,
        errors: 0,
        estimatedTimeRemaining: this.calculateEstimatedTime(videosToMigrate.length)
      };

      for (let i = 0; i < videosToMigrate.length && !this.shouldStop; i++) {
        const video = videosToMigrate[i];
        
        try {
          await this.processVideoPreview(video, options);
          this.migrationStatus.completed++;
        } catch (error) {
          console.error(`Failed to process video ${video.id}:`, error);
          this.migrationStatus.errors++;
        }

        this.migrationStatus.processed = i + 1;
        
        // Update estimated time remaining
        const elapsed = Date.now() - this.startTime;
        const avgTimePerVideo = elapsed / (i + 1);
        const remaining = (videosToMigrate.length - (i + 1)) * avgTimePerVideo;
        this.migrationStatus.estimatedTimeRemaining = Math.ceil(remaining / 1000);

        progressCallback?.(this.migrationStatus.processed, this.migrationStatus.total);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.migrationStatus.isProcessing = false;
    } catch (error) {
      console.error('Migration failed:', error);
      this.migrationStatus.isProcessing = false;
      throw error;
    }
  }

  private static async processVideoPreview(
    video: any,
    options: MigrationOptions
  ) {
    // Call the Supabase Edge Function to process video preview
    const { data, error } = await supabase.functions.invoke('process-video', {
      body: {
        videoId: video.id,
        videoUrl: video.video_url,
        generateStatic: options.generateStatic,
        generateAnimated: options.generateAnimated,
        migrateToWebP: true
      }
    });

    if (error) throw error;

    // Update the video record with new preview URLs
    if (data?.preview_url) {
      const { error: updateError } = await supabase
        .from('videos')
        .update({ 
          preview_url: data.preview_url,
          thumbnail_url: data.thumbnail_url || video.thumbnail_url
        })
        .eq('id', video.id);

      if (updateError) throw updateError;
    }
  }

  static calculateEstimatedTime(videoCount: number): number {
    // Estimate based on average processing time per video
    // Static WebP: ~2-3 seconds per video
    // Animated WebP: ~5-8 seconds per video
    // Adding network overhead and processing time
    const avgTimePerVideo = 5; // seconds
    return videoCount * avgTimePerVideo;
  }

  static getMigrationStatus(): MigrationStatus {
    return { ...this.migrationStatus };
  }

  static stopMigration() {
    this.shouldStop = true;
    this.migrationStatus.isProcessing = false;
  }

  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
}

export default VideoMigrationService;
