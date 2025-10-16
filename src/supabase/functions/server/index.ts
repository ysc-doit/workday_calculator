import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) {
    return corsResponse
  }

  return new Response(
    JSON.stringify({ 
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      service: 'workday-calculator-server'
    }),
    { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      } 
    }
  )
})