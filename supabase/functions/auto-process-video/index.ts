
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    // This function is triggered by a database webhook when a new video is inserted
    if (record && record.video_url && record.id) {
      console.log(`Auto-processing video: ${record.id}`)
      
      // Call the process-video function
      const processResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          videoId: record.id,
          hlsUrl: record.video_url, // Assuming this is the HLS URL from Bunny Stream
          title: record.title || 'Untitled',
          userId: record.owner_id,
          generatePreviews: true
        })
      })
      
      const result = await processResponse.json()
      console.log('Auto-processing result:', result)
      
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'No processing needed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Auto-processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
