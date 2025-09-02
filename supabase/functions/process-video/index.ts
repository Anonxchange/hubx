
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import FFmpeg WASM
const FFmpeg = await import('https://esm.sh/@ffmpeg/ffmpeg@0.12.7')
const { fetchFile } = await import('https://esm.sh/@ffmpeg/util@0.12.1')

const BUNNY_STORAGE_API_KEY = Deno.env.get('BUNNY_STORAGE_API_KEY') || 'b21ef96d-bb4c-4e4a-8ab9b2339ad3-f66d-4916';
const BUNNY_STORAGE_ZONE = 'hubx';
const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
const BUNNY_CDN_URL = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net`;

interface PreviewTimestamp {
  time: number;
  filename: string;
}

class VideoPreviewProcessor {
  private ffmpeg: any;
  private isLoaded = false;

  async init() {
    if (this.isLoaded) return;
    
    try {
      this.ffmpeg = new FFmpeg.FFmpeg();
      
      // Load FFmpeg with WebAssembly
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
      await this.ffmpeg.load({
        coreURL: await fetchFile(`${baseURL}/ffmpeg-core.js`),
        wasmURL: await fetchFile(`${baseURL}/ffmpeg-core.wasm`),
      });
      
      this.isLoaded = true;
      console.log('FFmpeg WASM loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('FFmpeg initialization failed');
    }
  }

  // Generate preview timestamps based on video duration
  generatePreviewTimestamps(durationSeconds: number): PreviewTimestamp[] {
    const timestamps: PreviewTimestamp[] = [];
    
    if (durationSeconds <= 60) {
      // Short video: every 15 seconds
      for (let i = 10; i < durationSeconds - 10; i += 15) {
        timestamps.push({
          time: i,
          filename: `preview_${i}s.webp`
        });
      }
    } else if (durationSeconds <= 300) {
      // Medium video: every 45 seconds
      for (let i = 30; i < durationSeconds - 20; i += 45) {
        timestamps.push({
          time: i,
          filename: `preview_${i}s.webp`
        });
      }
    } else {
      // Long video: distributed timestamps
      const intervals = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];
      intervals.forEach((ratio, index) => {
        const time = Math.floor(durationSeconds * ratio);
        timestamps.push({
          time,
          filename: `preview_${time}s.webp`
        });
      });
    }

    return timestamps.slice(0, 6); // Max 6 previews
  }

  // Extract video duration from HLS manifest
  async extractDurationFromHLS(hlsUrl: string): Promise<number> {
    try {
      const response = await fetch(hlsUrl);
      const manifest = await response.text();
      
      // Look for EXT-X-TARGETDURATION or calculate from segments
      const lines = manifest.split('\n');
      let totalDuration = 0;
      
      for (const line of lines) {
        if (line.startsWith('#EXTINF:')) {
          const duration = parseFloat(line.split(':')[1].split(',')[0]);
          totalDuration += duration;
        }
      }
      
      return totalDuration || 300; // Default fallback
    } catch (error) {
      console.error('Failed to extract HLS duration:', error);
      return 300; // Default fallback
    }
  }

  // Download and process HLS stream segments for specific timestamp
  async downloadHLSSegment(hlsUrl: string, timestamp: number, duration: number = 10): Promise<Uint8Array> {
    try {
      const response = await fetch(hlsUrl);
      const manifest = await response.text();
      const lines = manifest.split('\n');
      
      let currentTime = 0;
      let targetSegmentUrl = '';
      const baseUrl = hlsUrl.substring(0, hlsUrl.lastIndexOf('/') + 1);
      
      // Find the segment that contains our target timestamp
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('#EXTINF:')) {
          const segmentDuration = parseFloat(line.split(':')[1].split(',')[0]);
          
          if (currentTime <= timestamp && timestamp < currentTime + segmentDuration) {
            // Found the segment, get the next line which should be the segment URL
            const segmentLine = lines[i + 1];
            if (segmentLine && !segmentLine.startsWith('#')) {
              targetSegmentUrl = segmentLine.startsWith('http') ? segmentLine : baseUrl + segmentLine;
              break;
            }
          }
          currentTime += segmentDuration;
        }
      }
      
      if (!targetSegmentUrl) {
        throw new Error(`No segment found for timestamp ${timestamp}`);
      }
      
      // Download the segment
      const segmentResponse = await fetch(targetSegmentUrl);
      if (!segmentResponse.ok) {
        throw new Error(`Failed to download segment: ${segmentResponse.status}`);
      }
      
      const segmentData = await segmentResponse.arrayBuffer();
      return new Uint8Array(segmentData);
      
    } catch (error) {
      console.error('HLS segment download error:', error);
      throw error;
    }
  }

  // Generate animated WebP preview using FFmpeg
  async generateAnimatedWebPPreview(
    hlsUrl: string, 
    timestamp: number, 
    videoId: string
  ): Promise<Uint8Array | null> {
    try {
      await this.init();
      
      // Download a longer segment (15 seconds) to have enough footage
      const segmentData = await this.downloadHLSSegment(hlsUrl, Math.max(0, timestamp - 2), 15);
      
      // Write input file to FFmpeg virtual filesystem
      const inputName = `input_${timestamp}.ts`;
      const outputName = `output_${timestamp}.webp`;
      
      await this.ffmpeg.writeFile(inputName, segmentData);
      
      // Extract 10-second animated WebP starting from timestamp
      // Use palette optimization for better quality and smaller size
      await this.ffmpeg.exec([
        '-i', inputName,
        '-ss', '2', // Skip first 2 seconds to get to our target timestamp
        '-t', '10', // 10 second duration
        '-vf', 'scale=480:270:flags=lanczos,fps=8', // 8 FPS for smaller size
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-compression_level', '6',
        '-q:v', '75',
        '-preset', 'default',
        '-loop', '0', // Infinite loop
        '-an', // No audio
        outputName
      ]);
      
      // Read the output file
      const outputData = await this.ffmpeg.readFile(outputName);
      
      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      
      return outputData as Uint8Array;
      
    } catch (error) {
      console.error(`Failed to generate WebP preview for timestamp ${timestamp}:`, error);
      return null;
    }
  }

  // Upload WebP to Bunny Storage
  async uploadWebPToBunny(
    webpData: Uint8Array, 
    filename: string, 
    userId: string
  ): Promise<string | null> {
    try {
      const path = `/previews/${userId}/${filename}`;
      
      const response = await fetch(`${BUNNY_STORAGE_URL}${path}`, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_API_KEY,
          'Content-Type': 'image/webp',
        },
        body: webpData,
      });

      if (response.ok) {
        const publicUrl = `${BUNNY_CDN_URL}${path}`;
        console.log(`WebP uploaded successfully: ${publicUrl}`);
        return publicUrl;
      } else {
        const errorText = await response.text();
        console.error('Bunny storage upload failed:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error uploading WebP to Bunny storage:', error);
      return null;
    }
  }

  // Upload static thumbnail to Bunny Storage
  async uploadThumbnailToBunny(
    thumbnailData: Uint8Array, 
    filename: string, 
    userId: string
  ): Promise<string | null> {
    try {
      const path = `/thumbnails/${userId}/${filename}`;
      
      const response = await fetch(`${BUNNY_STORAGE_URL}${path}`, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_API_KEY,
          'Content-Type': 'image/jpeg',
        },
        body: thumbnailData,
      });

      if (response.ok) {
        const publicUrl = `${BUNNY_CDN_URL}${path}`;
        console.log(`Thumbnail uploaded successfully: ${publicUrl}`);
        return publicUrl;
      } else {
        const errorText = await response.text();
        console.error('Bunny storage thumbnail upload failed:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error uploading thumbnail to Bunny storage:', error);
      return null;
    }
  }
}

// Extract video metadata from HLS
async function extractVideoMetadata(hlsUrl: string): Promise<{ duration: string; durationSeconds: number }> {
  try {
    const processor = new VideoPreviewProcessor();
    const durationSeconds = await processor.extractDurationFromHLS(hlsUrl);
    
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return { duration, durationSeconds };
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return { duration: "0:00", durationSeconds: 0 };
  }
}

// Generate static thumbnail from video
async function generateThumbnail(hlsUrl: string): Promise<Blob> {
  try {
    const processor = new VideoPreviewProcessor();
    await processor.init();
    
    // Download first segment for thumbnail
    const segmentData = await processor.downloadHLSSegment(hlsUrl, 5); // 5 seconds in
    
    await processor.ffmpeg.writeFile('input.ts', segmentData);
    
    // Extract single frame as JPEG thumbnail
    await processor.ffmpeg.exec([
      '-i', 'input.ts',
      '-ss', '0',
      '-vframes', '1',
      '-vf', 'scale=320:180',
      '-q:v', '2',
      'thumbnail.jpg'
    ]);
    
    const thumbnailData = await processor.ffmpeg.readFile('thumbnail.jpg');
    
    // Clean up
    await processor.ffmpeg.deleteFile('input.ts');
    await processor.ffmpeg.deleteFile('thumbnail.jpg');
    
    return new Blob([thumbnailData], { type: 'image/jpeg' });
    
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    // Fallback placeholder
    const canvas = new OffscreenCanvas(320, 180);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('Thumbnail', 120, 95);
    }
    return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const body = await req.json();
    const {
      videoId,
      hlsUrl, // Bunny Stream HLS URL
      title,
      userId,
      generatePreviews = true
    } = body;

    if (!videoId || !hlsUrl || !userId) {
      throw new Error('Missing required fields: videoId, hlsUrl, or userId');
    }

    console.log(`Processing video: ${title} (ID: ${videoId})`);
    console.log(`HLS URL: ${hlsUrl}`);

    // Extract metadata from HLS
    const metadata = await extractVideoMetadata(hlsUrl);
    console.log(`Video duration: ${metadata.duration} (${metadata.durationSeconds}s)`);

    // Generate thumbnail
    const thumbnailBlob = await generateThumbnail(hlsUrl);
    
    // Upload thumbnail to Bunny Storage (not Supabase)
    const thumbnailFilename = `${videoId}_thumbnail.jpg`;
    const processor = new VideoPreviewProcessor();
    
    // Convert blob to Uint8Array for Bunny upload
    const thumbnailArrayBuffer = await thumbnailBlob.arrayBuffer();
    const thumbnailData = new Uint8Array(thumbnailArrayBuffer);
    
    const thumbnailUrl = await processor.uploadThumbnailToBunny(
      thumbnailData,
      thumbnailFilename,
      userId
    );

    if (!thumbnailUrl) {
      console.error('Failed to upload thumbnail to Bunny Storage');
    }

    let previewUrls: string[] = [];

    // Generate WebP previews if requested and video is long enough
    if (generatePreviews && metadata.durationSeconds > 30) {
      console.log('Generating WebP previews...');
      
      const processor = new VideoPreviewProcessor();
      const timestamps = processor.generatePreviewTimestamps(metadata.durationSeconds);
      
      console.log(`Generating ${timestamps.length} previews at timestamps:`, timestamps.map(t => t.time));

      // Process each timestamp
      for (const timestampInfo of timestamps) {
        try {
          console.log(`Processing timestamp ${timestampInfo.time}s...`);
          
          const webpData = await processor.generateAnimatedWebPPreview(
            hlsUrl,
            timestampInfo.time,
            videoId
          );
          
          if (webpData) {
            const filename = `${videoId}_${timestampInfo.time}s_preview.webp`;
            const uploadUrl = await processor.uploadWebPToBunny(
              webpData,
              filename,
              userId
            );
            
            if (uploadUrl) {
              previewUrls.push(uploadUrl);
              console.log(`Preview ${timestampInfo.time}s uploaded: ${uploadUrl}`);
            }
          }
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Failed to process timestamp ${timestampInfo.time}:`, error);
        }
      }
    }

    // Update video record in Supabase (metadata only)
    const updateData: any = {
      duration: metadata.duration,
      thumbnail_url: thumbnailUrl, // Bunny Storage URL
      processing_status: 'completed',
      updated_at: new Date().toISOString()
    };

    // Add preview URLs
    if (previewUrls.length > 0) {
      updateData.preview_urls = previewUrls;
      updateData.preview_url = previewUrls[0]; // Main preview URL
      console.log(`Generated ${previewUrls.length} WebP previews`);
    }

    const { error: updateError } = await supabaseClient
      .from('videos')
      .update(updateData)
      .eq('id', videoId);

    if (updateError) {
      console.error('Failed to update video record:', updateError);
      throw updateError;
    }

    const result = {
      videoId,
      duration: metadata.duration,
      thumbnail_url: thumbnailUrl, // Bunny Storage URL
      preview_urls: previewUrls,
      preview_count: previewUrls.length,
      processing_status: 'completed'
    };

    console.log('Video processing completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing video:', error);
    
    // Update video status to failed if we have videoId
    try {
      const body = await req.clone().json();
      if (body.videoId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        
        await supabaseClient
          .from('videos')
          .update({ 
            processing_status: 'failed',
            error_message: error.message 
          })
          .eq('id', body.videoId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
