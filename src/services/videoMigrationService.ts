
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
  errorDetails?: Array<{
    videoId: string;
    title: string;
    error: string;
    timestamp: string;
  }>;
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
          console.log(`✅ Successfully migrated video: ${video.title} (${video.id})`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorDetails = {
            videoId: video.id,
            title: video.title,
            videoUrl: video.video_url,
            previewUrl: video.preview_url,
            error: errorMessage,
            timestamp: new Date().toISOString()
          };
          
          console.error(`❌ Failed to process video ${video.id} (${video.title}):`, errorDetails);
          this.migrationStatus.errors++;
          
          // Store error details for later analysis
          this.migrationStatus.errorDetails = this.migrationStatus.errorDetails || [];
          this.migrationStatus.errorDetails.push(errorDetails);
          
          // Log specific error types for debugging
          if (errorMessage.includes('fetch')) {
            console.error('  → Network/fetch error - check video URL accessibility');
          } else if (errorMessage.includes('WebP')) {
            console.error('  → WebP conversion error - video format might be incompatible');
          } else if (errorMessage.includes('Database')) {
            console.error('  → Database error - check video record integrity');
          }
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
    // Validate video data
    if (!video.video_url) {
      throw new Error('Video URL is missing');
    }

    // Call the Supabase Edge Function to process video preview
    const { data, error } = await supabase.functions.invoke('process-video', {
      body: {
        videoId: video.id,
        videoUrl: video.video_url,
        title: video.title || `video-${video.id}`,
        generateStatic: options.generateStatic,
        generateAnimated: options.generateAnimated,
        migrateToWebP: true
      }
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    // Update the video record with new preview URLs
    if (data.preview_url) {
      const { error: updateError } = await supabase
        .from('videos')
        .update({ 
          preview_url: data.preview_url,
          thumbnail_url: data.thumbnail_url || video.thumbnail_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id);

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`);
      }
    } else {
      throw new Error('No preview URL generated');
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
