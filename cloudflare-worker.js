/**
 * Cloudflare Worker for FutureLinks.ai CORS Proxy
 * 
 * Deploy this to Cloudflare Workers (free tier):
 * 1. Go to https://workers.cloudflare.com/
 * 2. Create new worker
 * 3. Paste this code
 * 4. Deploy
 * 5. Copy the worker URL (e.g., https://your-worker.workers.dev)
 * 6. Update ConversationService.js with your worker URL
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Get the request body and headers
  const body = await request.text()
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401 })
  }

  try {
    // Forward request to FutureLinks.ai API
    const response = await fetch('https://api.upliftai.org/v1/synthesis/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: body
    })

    // Get the audio response
    const audioData = await response.arrayBuffer()

    // Return with CORS headers
    return new Response(audioData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      }
    })
  } catch (error) {
    return new Response('Proxy error: ' + error.message, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// Handle CORS preflight
addEventListener('fetch', event => {
  if (event.request.method === 'OPTIONS') {
    event.respondWith(new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      }
    }))
  }
})
