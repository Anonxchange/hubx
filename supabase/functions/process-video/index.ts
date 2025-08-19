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

async function convertToWebP(videoBlob: Blob, options: { static: boolean; animated: boolean }): Promise<Blob> {
  // Create a video element to extract frame at 5 seconds
  const videoUrl = URL.createObjectURL(videoBlob)
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      // Seek to 5 seconds or 10% of video duration, whichever is smaller
      const seekTime = Math.min(5, video.duration * 0.1)
      video.currentTime = seekTime
    }
    
    video.onseeked = () => {
      try {
        const canvas = new OffscreenCanvas(480, 270)
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('Cannot get canvas context')
        }
        
        // Draw the video frame
        ctx.drawImage(video, 0, 0, 480, 270)
        
        // Convert to WebP
        canvas.convertToBlob({ 
          type: 'image/webp', 
          quality: options.static ? 0.8 : 0.6 
        }).then(blob => {
          URL.revokeObjectURL(videoUrl)
          resolve(blob)
        }).catch(reject)
        
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        reject(error)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      reject new Error('Failed to load video for frame extraction')
    }
    
    video.ontimeupdate = () => {
      // Fallback - if seeking doesn't work, use current frame
      if (video.currentTime > 0) {
        video.onseeked()
      }
    }
    
    video.src = videoUrl
  })
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

    const contentType = req.headers.get('content-type') || '';
    
    let videoFile: File | null = null;
    let title = '';
    let migrateToWebP = false;
    let generateStatic = true;
    let generateAnimated = false;
    let videoUrl = '';

    if (contentType.includes('multipart/form-data')) {
      // Handle form data upload
      const formData = await req.formData()
      videoFile = formData.get('video') as File
      title = formData.get('title') as string
      migrateToWebP = formData.get('migrateToWebP') === 'true'
      generateStatic = formData.get('generateStatic') !== 'false'
      generateAnimated = formData.get('generateAnimated') === 'true'
    } else {
      // Handle JSON body for migration
      const body = await req.json()
      title = body.title || 'untitled'
      migrateToWebP = body.migrateToWebP === true
      generateStatic = body.generateStatic !== false
      generateAnimated = body.generateAnimated === true
      videoUrl = body.videoUrl
      
      if (!videoUrl) {
        throw new Error('No video URL provided for migration')
      }
      
      // Fetch video from URL for processing
      console.log(`Fetching video from URL: ${videoUrl}`)
      
      try {
        const videoResponse = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EdgeFunction/1.0)',
            'Accept': 'video/*,*/*;q=0.9'
          }
        })
        
        if (!videoResponse.ok) {
          throw new Error(`HTTP ${videoResponse.status}: ${videoResponse.statusText}`)
        }
        
        const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
        const videoArrayBuffer = await videoResponse.arrayBuffer()
        
        if (videoArrayBuffer.byteLength === 0) {
          throw new Error('Empty video file received')
        }
        
        console.log(`Video fetched successfully: ${videoArrayBuffer.byteLength} bytes, type: ${contentType}`)
        videoFile = new File([videoArrayBuffer], 'video.mp4', { type: contentType })
        
      } catch (fetchError) {
        console.error('Video fetch error:', fetchError)
        throw new Error(`Failed to fetch video from ${videoUrl}: ${fetchError.message}`)
      }
    }

    if (!videoFile) {
      throw new Error('No video file provided')
    }

    console.log(`Processing video: ${title}, size: ${videoFile.size}, migration: ${migrateToWebP}`)
    console.log(`Migration options - Static: ${generateStatic}, Animated: ${generateAnimated}`)

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
      try {
        console.log('Converting to WebP format...')
        // Convert video to WebP format (extract frame)
        const webpBlob = await convertToWebP(videoBlob, { 
          static: generateStatic !== false, 
          animated: generateAnimated === true 
        });
        
        if (!webpBlob || webpBlob.size === 0) {
          throw new Error('WebP conversion resulted in empty blob')
        }
        
        webpPreviewPath = `${baseFilename}-preview.webp`;
        console.log(`Uploading WebP preview: ${webpPreviewPath}, size: ${webpBlob.size} bytes`)
        
        const { error: webpError } = await supabaseClient.storage
          .from('previews')
          .upload(webpPreviewPath, webpBlob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (webpError) {
          console.error('WebP upload error:', webpError)
          throw new Error(`WebP upload failed: ${webpError.message}`)
        }
        
        console.log('WebP preview uploaded successfully')
      } catch (webpError) {
        console.error('WebP generation failed:', webpError)
        // Don't throw here - continue with regular preview as fallback
        console.log('Continuing with regular preview as fallback...')
      }
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