import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) {
    return corsResponse
  }

  try {
    const url = new URL(req.url)
    
    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Workday Calculator API is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          status: 'healthy'
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    // API info endpoint
    if (url.pathname === '/api/info') {
      return new Response(
        JSON.stringify({ 
          name: 'Workday Calculator API',
          version: '1.0.0',
          description: 'API for Taiwan workday calculations',
          endpoints: {
            '/health': 'Health check',
            '/api/info': 'API information'
          }
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    // Default 404 response
    return new Response(
      JSON.stringify({ 
        error: 'Route not found',
        message: 'The requested endpoint does not exist',
        available_routes: ['/', '/health', '/api/info']
      }),
      { 
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        } 
      }
    )

  } catch (error) {
    console.error('Error in make-server function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        } 
      }
    )
  }
})