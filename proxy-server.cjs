/**
 * CORS Proxy Server for FutureLinks.ai TTS API
 * 
 * This proxy server forwards TTS requests to upliftai.org/api/tts
 * and adds CORS headers to allow browser access.
 * 
 * Usage:
 *   node proxy-server.js
 * 
 * Then update your browser app to use:
 *   http://localhost:3000/api/tts instead of https://upliftai.org/api/tts
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'FutureLinks.ai TTS Proxy Server',
    endpoints: {
      tts: '/api/tts (POST)'
    }
  });
});

// Proxy endpoint for FutureLinks.ai TTS
app.post('/api/tts', async (req, res) => {
  try {
    console.log('📡 Proxying TTS request to upliftai.org...');
    console.log('   Request body:', JSON.stringify(req.body, null, 2));
    
    // Get Authorization header from request
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Missing Authorization header'
      });
    }
    
    // Forward request to FutureLinks.ai API
    const response = await axios.post(
      'https://upliftai.org/api/tts',
      req.body,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    console.log('✅ Received audio from upliftai.org');
    console.log('   Size:', response.data.length, 'bytes');
    
    // Forward the audio response back to browser
    res.set('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.send(response.data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    
    if (error.response) {
      // Forward error from FutureLinks.ai API
      console.error('   API error status:', error.response.status);
      console.error('   API error data:', error.response.data?.toString());
      
      res.status(error.response.status).json({
        error: 'FutureLinks.ai API error',
        message: error.message,
        details: error.response.data?.toString()
      });
    } else {
      // Network or other error
      res.status(500).json({
        error: 'Proxy server error',
        message: error.message
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 FutureLinks.ai TTS Proxy Server started');
  console.log(`📍 Listening on http://localhost:${PORT}`);
  console.log('');
  console.log('📝 Usage:');
  console.log('   Update your browser app to use:');
  console.log(`   http://localhost:${PORT}/api/tts`);
  console.log('   instead of:');
  console.log('   https://upliftai.org/api/tts');
  console.log('');
  console.log('✅ CORS enabled - browser requests will work!');
});
