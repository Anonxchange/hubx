
import VideoPreviewService from './videoPreviewService';
import { supabase } from '@/integrations/supabase/client';

export class VideoMigrationService {
  private static isProcessing = false;
  private static processedCount = 0;
  private static totalCount = 0;

  // Start processing existing videos in batches
  static async migrateToWebPPreviews(
    batchSize: number = 5,
    onProgress?: (processed: number, total: number) => void
  ): Promise<void> {
    if (this.isProcessing) {
      console.log('Migration already in progress');
      return;
    }

    this.isProcessing = true;
    this.processedCount = 0;

    try {
      // Get total count of videos needing migration
      const { count: totalVideos } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .or('preview_url.is.null,preview_url.not.like.%.webp')
        .eq('is_premium', false)
        .eq('is_moment', false);

      this.totalCount = totalVideos || 0;
      
      if (this.totalCount === 0) {
        console.log('No videos need WebP preview migration');
        return;
      }

      console.log(`Starting migration of ${this.totalCount} videos...`);

      let offset = 0;
      let hasMore = true;

      while (hasMore && this.isProcessing) {
        // Get batch of videos
        const { data: videos, error } = await supabase
          .from('videos')
          .select('id, video_url, duration, owner_id, preview_url, title')
          .or('preview_url.is.null,preview_url.not.like.%.webp')
          .eq('is_premium', false)
          .eq('is_moment', false)
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error('Error fetching videos for migration:', error);
          break;
        }

        if (!videos || videos.length === 0) {
          hasMore = false;
          break;
        }

        // Process each video in the batch
        for (const video of videos) {
          if (!this.isProcessing) break;

          try {
            console.log(`Migrating video: ${video.title} (${video.id})`);
            
            await VideoPreviewService.generateAndUploadWebPPreviews(
              video.id,
              video.video_url,
              video.duration,
              video.owner_id
            );

            this.processedCount++;
            
            if (onProgress) {
              onProgress(this.processedCount, this.totalCount);
            }

            // Small delay between videos
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.error(`Failed to migrate video ${video.id}:`, error);
            this.processedCount++; // Count as processed even if failed
          }
        }

        offset += batchSize;
        
        // Longer delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`Migration completed. Processed ${this.processedCount} videos.`);

    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Stop the migration process
  static stopMigration(): void {
    this.isProcessing = false;
    console.log('Migration stopped by user');
  }

  // Get migration status
  static getMigrationStatus(): {
    isProcessing: boolean;
    processed: number;
    total: number;
    progress: number;
  } {
    return {
      isProcessing: this.isProcessing,
      processed: this.processedCount,
      total: this.totalCount,
      progress: this.totalCount > 0 ? (this.processedCount / this.totalCount) * 100 : 0
    };
  }

  // Process a single video
  static async migrateSingleVideo(videoId: string): Promise<boolean> {
    try {
      const { data: video, error } = await supabase
        .from('videos')
        .select('id, video_url, duration, owner_id, preview_url')
        .eq('id', videoId)
        .single();

      if (error || !video) {
        console.error('Video not found:', error);
        return false;
      }

      // Check if already has WebP preview
      if (video.preview_url && video.preview_url.endsWith('.webp')) {
        console.log('Video already has WebP preview');
        return true;
      }

      const previewUrls = await VideoPreviewService.generateAndUploadWebPPreviews(
        video.id,
        video.video_url,
        video.duration,
        video.owner_id
      );

      return previewUrls.length > 0;

    } catch (error) {
      console.error('Error migrating single video:', error);
      return false;
    }
  }
}

export default VideoMigrationService;
