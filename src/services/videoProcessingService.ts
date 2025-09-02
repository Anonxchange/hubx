
import { supabase } from '@/integrations/supabase/client';

export class VideoProcessingService {
  // Process a single video manually
  static async processVideo(videoId: string, hlsUrl: string, userId: string): Promise<boolean> {
    try {
      // Update status to processing
      await supabase
        .from('videos')
        .update({ processing_status: 'processing' })
        .eq('id', videoId);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-video`, {
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
      console.log('Video processing completed:', result);
      return true;
      
    } catch (error) {
      console.error('Video processing failed:', error);
      
      // Update status to failed
      await supabase
        .from('videos')
        .update({ 
          processing_status: 'failed',
          error_message: error.message 
        })
        .eq('id', videoId);
      
      return false;
    }
  }

  // Batch process multiple videos
  static async batchProcessVideos(batchSize: number = 5): Promise<void> {
    try {
      console.log('Starting batch video processing...');
      
      // Get videos that need processing
      const { data: videos, error } = await supabase
        .from('videos')
        .select('id, video_url, owner_id, title')
        .eq('processing_status', 'pending')
        .limit(batchSize);

      if (error) {
        console.error('Error fetching videos for processing:', error);
        return;
      }

      if (!videos || videos.length === 0) {
        console.log('No videos found that need processing');
        return;
      }

      console.log(`Processing ${videos.length} videos...`);

      for (const video of videos) {
        console.log(`Processing video ${video.id}: ${video.title}`);
        
        await this.processVideo(video.id, video.video_url, video.owner_id);
        
        // Add delay between processing to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('Batch processing completed');
      
    } catch (error) {
      console.error('Error in batch processing:', error);
    }
  }

  // Check processing status
  static async getProcessingStatus(videoId: string): Promise<string> {
    const { data: video, error } = await supabase
      .from('videos')
      .select('processing_status, error_message')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return 'unknown';
    }

    return video.processing_status || 'pending';
  }

  // Retry failed processing
  static async retryFailedProcessing(videoId: string): Promise<boolean> {
    try {
      const { data: video, error } = await supabase
        .from('videos')
        .select('video_url, owner_id, title')
        .eq('id', videoId)
        .single();

      if (error || !video) {
        throw new Error('Video not found');
      }

      return await this.processVideo(videoId, video.video_url, video.owner_id);
      
    } catch (error) {
      console.error('Failed to retry processing:', error);
      return false;
    }
  }
}

export default VideoProcessingService;
