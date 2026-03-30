// Disabled - using local storage only
export default async function handler() {
  return new Response(
    JSON.stringify({ 
      status: 'disabled',
      message: 'Supabase integration disabled - using local storage only'
    }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 200
    }
  )
}
