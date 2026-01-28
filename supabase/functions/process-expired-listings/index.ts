import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing expired listings...')

    // Find all published listings that have passed their expiry date
    const now = new Date().toISOString()
    
    const { data: expiredListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, agent_id, expires_at')
      .eq('status', 'published')
      .lt('expires_at', now)
      .not('expires_at', 'is', null)

    if (fetchError) {
      console.error('Error fetching expired listings:', fetchError)
      throw fetchError
    }

    if (!expiredListings || expiredListings.length === 0) {
      console.log('No expired listings found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired listings found',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredListings.length} expired listings`)

    // Update all expired listings to 'expired' status
    const { error: updateError, count } = await supabase
      .from('listings')
      .update({ status: 'expired' })
      .eq('status', 'published')
      .lt('expires_at', now)
      .not('expires_at', 'is', null)

    if (updateError) {
      console.error('Error updating expired listings:', updateError)
      throw updateError
    }

    // Log which listings were expired
    for (const listing of expiredListings) {
      console.log(`Expired listing: ${listing.title} (ID: ${listing.id})`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${expiredListings.length} expired listings`,
        processed: expiredListings.length,
        listings: expiredListings.map(l => ({ id: l.id, title: l.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing expired listings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
