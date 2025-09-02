
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
  public ffmpeg: any;
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

  // Generate scene timestamps for single 10-second preview
  generateSceneTimestamps(durationSeconds: number): number[] {
    const scenes: number[] = [];
    
    if (durationSeconds <= 60) {
      // Short video: 3-4 scenes
      scenes.push(
        Math.floor(durationSeconds * 0.15),
        Math.floor(durationSeconds * 0.4),
        Math.floor(durationSeconds * 0.65),
        Math.floor(durationSeconds * 0.85)
      );
    } else if (durationSeconds <= 300) {
      // Medium video: 4-5 scenes
      scenes.push(
        Math.floor(durationSeconds * 0.1),
        Math.floor(durationSeconds * 0.3),
        Math.floor(durationSeconds * 0.5),
        Math.floor(durationSeconds * 0.7),
        Math.floor(durationSeconds * 0.9)
      );
    } else {
      // Long video: 5-6 scenes from different parts
      scenes.push(
        Math.floor(durationSeconds * 0.08),
        Math.floor(durationSeconds * 0.25),
        Math.floor(durationSeconds * 0.42),
        Math.floor(durationSeconds * 0.58),
        Math.floor(durationSeconds * 0.75),
        Math.floor(durationSeconds * 0.92)
      );
    }

    return scenes.filter(scene => scene > 5 && scene < durationSeconds - 5); // Ensure valid timestamps
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

  // Generate single 10-second preview with scenes from different parts of video
  async generateSceneBasedPreview(
    hlsUrl: string, 
    videoId: string,
    durationSeconds: number
  ): Promise<Uint8Array | null> {
    try {
      await this.init();
      
      const sceneTimestamps = this.generateSceneTimestamps(durationSeconds);
      const secondsPerScene = Math.floor(10 / sceneTimestamps.length); // Divide 10 seconds among scenes
      
      console.log(`Creating preview with ${sceneTimestamps.length} scenes, ${secondsPerScene}s each`);
      
      const sceneFiles: string[] = [];
      
      // Download and process each scene
      for (let i = 0; i < sceneTimestamps.length; i++) {
        const timestamp = sceneTimestamps[i];
        const segmentData = await this.downloadHLSSegment(hlsUrl, timestamp, secondsPerScene + 2);
        
        const inputName = `scene_${i}.ts`;
        const outputName = `scene_${i}.webp`;
        
        await this.ffmpeg.writeFile(inputName, segmentData);
        
        // Extract scene clip
        await this.ffmpeg.exec([
          '-i', inputName,
          '-ss', '1',
          '-t', secondsPerScene.toString(),
          '-vf', 'scale=480:270:flags=lanczos,fps=8',
          '-c:v', 'libwebp',
          '-lossless', '0',
          '-compression_level', '6',
          '-q:v', '75',
          '-preset', 'default',
          '-an',
          outputName
        ]);
        
        sceneFiles.push(outputName);
        
        // Clean up input
        await this.ffmpeg.deleteFile(inputName);
      }
      
      // Concatenate all scenes into one 10-second preview
      const finalOutput = `final_preview_${videoId}.webp`;
      
      // Create filter complex to concatenate WebP files
      const filterComplex = sceneFiles.map((file, i) => `[${i}:v]`).join('') + 
        `concat=n=${sceneFiles.length}:v=1[outv]`;
      
      const ffmpegArgs = [
        ...sceneFiles.flatMap(file => ['-i', file]),
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-compression_level', '6',
        '-q:v', '75',
        '-preset', 'default',
        '-loop', '0', // Infinite loop
        finalOutput
      ];
      
      await this.ffmpeg.exec(ffmpegArgs);
      
      // Read the final preview
      const outputData = await this.ffmpeg.readFile(finalOutput);
      
      // Clean up all temporary files
      for (const file of sceneFiles) {
        await this.ffmpeg.deleteFile(file);
      }
      await this.ffmpeg.deleteFile(finalOutput);
      
      return outputData as Uint8Array;
      
    } catch (error) {
      console.error(`Failed to generate scene-based preview:`, error);
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

    let previewUrl: string | null = null;

    // Generate single scene-based preview if requested and video is long enough
    if (generatePreviews && metadata.durationSeconds > 30) {
      console.log('Generating single 10-second scene-based preview...');
      
      const processor = new VideoPreviewProcessor();
      
      try {
        const webpData = await processor.generateSceneBasedPreview(
          hlsUrl,
          videoId,
          metadata.durationSeconds
        );
        
        if (webpData) {
          const filename = `${videoId}_hover_preview.webp`;
          const uploadUrl = await processor.uploadWebPToBunny(
            webpData,
            filename,
            userId
          );
          
          if (uploadUrl) {
            previewUrl = uploadUrl;
            console.log(`Hover preview uploaded: ${uploadUrl}`);
          }
        }
        
      } catch (error) {
        console.error(`Failed to generate hover preview:`, error);
      }
    }

    // Update video record in Supabase (metadata only)
    const updateData: any = {
      duration: metadata.duration,
      thumbnail_url: thumbnailUrl, // Bunny Storage URL
      processing_status: 'completed',
      updated_at: new Date().toISOString()
    };

    // Add single preview URL
    if (previewUrl) {
      updateData.preview_url = previewUrl; // Single hover preview URL
      console.log(`Generated hover preview: ${previewUrl}`);
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
      preview_url: previewUrl,
      has_preview: !!previewUrl,
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
