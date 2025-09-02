import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FFmpeg } from "https://esm.sh/@ffmpeg/ffmpeg@0.12.10";
import { fetchFile, toBlobURL } from "https://esm.sh/@ffmpeg/util@0.12.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// BunnyCDN configuration
const BUNNY_STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE')!;
const BUNNY_STORAGE_API_KEY = Deno.env.get('BUNNY_STORAGE_API_KEY')!;
const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;

interface ProcessVideoRequest {
  videoId: string;
  hlsUrl: string;
  userId: string;
  title?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let requestBody: ProcessVideoRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Invalid JSON:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    const { videoId, hlsUrl, userId, title } = requestBody;
    if (!videoId || !hlsUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: videoId, hlsUrl, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing video ${videoId} for user ${userId}`);

    // Kick off background processing and return immediately
    async function backgroundTask() {
      try {
        // Step 1: Fetch HLS playlist
        console.log('Fetching HLS playlist...');
        const playlistResponse = await fetch(hlsUrl);
        if (!playlistResponse.ok) {
          throw new Error(`Failed to fetch HLS playlist: ${playlistResponse.status}`);
        }
        const playlistContent = await playlistResponse.text();
        console.log('HLS playlist fetched successfully');

        // Step 2: Parse playlist and get segment URLs
        const segmentUrls = parseHLSPlaylist(playlistContent, hlsUrl);
        if (segmentUrls.length === 0) {
          throw new Error('No video segments found in HLS playlist');
        }

        // Step 3: Select multiple segments from different parts of the video
        const desiredClips = Math.min(5, Math.max(2, segmentUrls.length >= 2 ? 5 : segmentUrls.length));
        const selectedSegmentUrls = pickEvenlySpaced(segmentUrls, desiredClips);
        console.log(`Selected ${selectedSegmentUrls.length} segments across the video`);

        // Step 4: Download the selected segments and write them to the FFmpeg FS
        console.log('Initializing FFmpeg...');
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
        const ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }) => console.log(message));

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        console.log('FFmpeg loaded successfully');

        const inputFiles: string[] = [];
        for (let i = 0; i < selectedSegmentUrls.length; i++) {
          const url = selectedSegmentUrls[i];
          console.log(`Downloading segment ${i + 1}/${selectedSegmentUrls.length}: ${url}`);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to download segment ${i}: ${res.status}`);
          const buf = new Uint8Array(await res.arrayBuffer());
          const fileName = `input_${i}.ts`;
          await ffmpeg.writeFile(fileName, await fetchFile(buf));
          inputFiles.push(fileName);
        }
        console.log('All selected segments written to FFmpeg FS');

        // Step 5: Build FFmpeg command to trim each segment and concatenate into a 10s animated WebP
        const totalDuration = 10;
        const perClip = (totalDuration / inputFiles.length);
        const perClipStr = perClip.toFixed(2);

        const args: string[] = [];
        inputFiles.forEach((file) => {
          args.push('-t', perClipStr, '-i', file);
        });

        const vLabels: string[] = [];
        const filters: string[] = [];
        for (let i = 0; i < inputFiles.length; i++) {
          const label = `v${i}`;
          filters.push(`[${i}:v]scale=640:-1:flags=lanczos,fps=12[${label}]`);
          vLabels.push(`[${label}]`);
        }
        const concat = `${vLabels.join('')}concat=n=${inputFiles.length}:v=1:a=0[outv]`;
        const filterGraph = `${filters.join(';')};${concat}`;

        const outputFileName = 'preview.webp';
        const ffmpegCmd = [
          ...args,
          '-filter_complex', filterGraph,
          '-map', '[outv]',
          '-an',
          '-vsync', '0',
          '-vcodec', 'libwebp',
          '-q:v', '70',
          '-preset', 'default',
          '-loop', '0',
          '-f', 'webp',
          outputFileName,
        ];

        console.log('Processing animated WebP with FFmpeg...');
        await ffmpeg.exec(ffmpegCmd);

        const processedData = await ffmpeg.readFile(outputFileName) as Uint8Array;
        console.log(`Animated WebP generated: ${processedData.length} bytes`);

        // Cleanup temp files
        try {
          for (const f of inputFiles) await ffmpeg.deleteFile(f);
          await ffmpeg.deleteFile(outputFileName);
        } catch (cleanupErr) {
          console.warn('Cleanup warning:', cleanupErr);
        }

        // Step 6: Upload to BunnyCDN
        const uploadPath = `previews/${videoId}/preview.webp`;
        const uploadUrl = `${BUNNY_STORAGE_URL}/${uploadPath}`;
        console.log(`Uploading to BunnyCDN: ${uploadPath}`);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': BUNNY_STORAGE_API_KEY,
            'Content-Type': 'image/webp',
          },
          body: processedData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('BunnyCDN upload failed:', uploadResponse.status, errorText);
          return; // Can't return body to client now; just log
        }

        console.log('Successfully uploaded to BunnyCDN');
        const previewUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${uploadPath}`;

        // Step 7: Update database with preview URL
        const { error: dbErr } = await supabase
          .from('videos')
          .update({ preview_url: previewUrl })
          .eq('id', videoId);
        if (dbErr) console.warn('DB update error:', dbErr.message);
        else console.log('Updated video record with preview URL');

      } catch (err) {
        console.error('Background processing error:', err);
      }
    }

    // Run in background and return 202 immediately
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - EdgeRuntime is provided in the Edge environment
    EdgeRuntime.waitUntil(backgroundTask());

    return new Response(
      JSON.stringify({ status: 'processing', videoId, title: title || 'Untitled' }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Video processing failed', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parse HLS playlist and extract segment URLs
 */
function parseHLSPlaylist(playlistContent: string, baseUrl: string): string[] {
  const lines = playlistContent.split('\n').map((line) => line.trim());
  const segmentUrls: string[] = [];

  // Get base URL for relative paths
  const urlObj = new URL(baseUrl);
  const basePath = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);

  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    if (line.includes('.ts') || line.includes('.m4s')) {
      let segmentUrl = line;
      if (!line.startsWith('http')) {
        segmentUrl = basePath + line;
      }
      segmentUrls.push(segmentUrl);
    }
  }

  console.log(`Found ${segmentUrls.length} segments in playlist`);
  return segmentUrls;
}

/**
 * Pick N evenly spaced items from an array
 */
function pickEvenlySpaced<T>(arr: T[], count: number): T[] {
  if (arr.length <= count) return arr.slice();
  const out: T[] = [];
  const step = (arr.length - 1) / (count - 1);
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    const idx = Math.round(i * step);
    if (!used.has(idx)) {
      out.push(arr[idx]);
      used.add(idx);
    }
  }
  // Fill if any duplicates were rounded the same index
  let cursor = 0;
  while (out.length < count && cursor < arr.length) {
    if (!used.has(cursor)) {
      out.push(arr[cursor]);
      used.add(cursor);
    }
    cursor++;
  }
  return out;
}

function uint8ToBase64(uint8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  return btoa(binary);
}