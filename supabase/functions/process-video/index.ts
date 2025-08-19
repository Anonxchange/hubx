import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple video processing without FFmpeg for now
async function extractVideoMetadata(videoBlob: Blob): Promise<{ duration: string }> {
  // For now, return a placeholder duration
  // In a production environment, you'd use FFmpeg or similar for actual processing
  return { duration: "0:00" }
}

async function generateThumbnail(videoBlob: Blob): Promise<Blob> {
  // Placeholder - in production, use FFmpeg to extract frame at 5 seconds
  // For now, create a simple placeholder image
  const canvas = new OffscreenCanvas(320, 180)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 320, 180)
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.fillText('Thumbnail', 120, 95)
  }
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
}

async function generatePreview(videoBlob: Blob): Promise<Blob> {
  // Placeholder - in production, use FFmpeg to create 10-second preview
  // For now, return the original video (you might want to implement actual preview generation)
  return videoBlob
}

async function convertToWebP(blob: Blob, options: { static: boolean; animated: boolean }): Promise<Blob> {
  // Placeholder WebP conversion - in production, use FFmpeg or similar
  // For now, create a simple WebP placeholder
  const canvas = new OffscreenCanvas(480, 270)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 480, 270)
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.fillText('WebP Preview', 180, 140)
  }
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })
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

    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const migrateToWebP = formData.get('migrateToWebP') === 'true'
    const generateStatic = formData.get('generateStatic') !== 'false'
    const generateAnimated = formData.get('generateAnimated') === 'true'

    if (!videoFile) {
      throw new Error('No video file provided')
    }

    console.log(`Processing video: ${videoFile.name}, size: ${videoFile.size}`)

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = videoFile.name.split('.').pop() || 'mp4'
    const baseFilename = `${timestamp}-${title.replace(/[^a-zA-Z0-9]/g, '-')}`

    // Process video
    const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: videoFile.type })
    const metadata = await extractVideoMetadata(videoBlob)
    const thumbnailBlob = await generateThumbnail(videoBlob)
    const previewBlob = await generatePreview(videoBlob)

    // Upload original video
    const videoPath = `${baseFilename}.${fileExt}`
    const { error: videoError } = await supabaseClient.storage
      .from('videos')
      .upload(videoPath, videoBlob, {
        contentType: videoFile.type,
        upsert: false
      })

    if (videoError) throw videoError

    // Upload thumbnail
    const thumbnailPath = `${baseFilename}-thumb.jpg`
    const { error: thumbError } = await supabaseClient.storage
      .from('thumbnails')
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (thumbError) throw thumbError

    // Generate WebP previews if requested
    let webpPreviewPath = null;
    if (migrateToWebP || generateStatic || generateAnimated) {
      // Convert preview to WebP format
      const webpBlob = await convertToWebP(previewBlob, { 
        static: generateStatic !== false, 
        animated: generateAnimated === true 
      });
      
      webpPreviewPath = `${baseFilename}-preview.webp`;
      const { error: webpError } = await supabaseClient.storage
        .from('previews')
        .upload(webpPreviewPath, webpBlob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (webpError) throw webpError;
    }

    // Upload original preview (fallback)
    const previewPath = `${baseFilename}-preview.${fileExt}`
    const { error: previewError } = await supabaseClient.storage
      .from('previews')
      .upload(previewPath, previewBlob, {
        contentType: videoFile.type,
        upsert: false
      })

    if (previewError && !webpPreviewPath) throw previewError

    // Get public URLs
    const { data: videoUrl } = supabaseClient.storage.from('videos').getPublicUrl(videoPath)
    const { data: thumbnailUrl } = supabaseClient.storage.from('thumbnails').getPublicUrl(thumbnailPath)
    const { data: previewUrl } = supabaseClient.storage.from('previews').getPublicUrl(webpPreviewPath || previewPath)

    const result = {
      video_url: videoUrl.publicUrl,
      thumbnail_url: thumbnailUrl.publicUrl,
      preview_url: previewUrl.publicUrl,
      duration: metadata.duration,
      file_size: videoFile.size,
      file_type: videoFile.type
    }

    console.log('Video processing completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error processing video:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})