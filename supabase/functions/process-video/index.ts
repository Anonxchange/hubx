
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate file types and size
function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only MP4, WebM, and OGG are allowed.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 100MB limit.' };
  }

  return { valid: true };
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Admin privileges required');
    }

    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string

    if (!videoFile) {
      throw new Error('No video file provided')
    }

    // Validate file
    const validation = validateFile(videoFile);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Sanitize title to prevent XSS
    const sanitizedTitle = title.replace(/[<>"'&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });

    console.log(`Processing video: ${videoFile.name}, size: ${videoFile.size}, user: ${user.id}`)

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = videoFile.name.split('.').pop() || 'mp4'
    const baseFilename = `${timestamp}-${sanitizedTitle.replace(/[^a-zA-Z0-9]/g, '-')}`

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

    // Upload preview
    const previewPath = `${baseFilename}-preview.${fileExt}`
    const { error: previewError } = await supabaseClient.storage
      .from('previews')
      .upload(previewPath, previewBlob, {
        contentType: videoFile.type,
        upsert: false
      })

    if (previewError) throw previewError

    // Get public URLs
    const { data: videoUrl } = supabaseClient.storage.from('videos').getPublicUrl(videoPath)
    const { data: thumbnailUrl } = supabaseClient.storage.from('thumbnails').getPublicUrl(thumbnailPath)
    const { data: previewUrl } = supabaseClient.storage.from('previews').getPublicUrl(previewPath)

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
        status: error.message.includes('authentication') || error.message.includes('privileges') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
