// Minimal server function - no complex operations
export default async function handler() {
  return new Response(
    JSON.stringify({ 
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    }
  )
}