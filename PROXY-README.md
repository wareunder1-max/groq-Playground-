# FutureLinks.ai TTS Proxy Server

## Why is this needed?

The FutureLinks.ai API (`upliftai.org`) doesn't have CORS (Cross-Origin Resource Sharing) enabled, which means browsers block direct requests to it. This proxy server runs locally and forwards requests to FutureLinks.ai, bypassing the CORS restriction.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the proxy server:**
   ```bash
   npm run proxy
   ```
   
   Or directly:
   ```bash
   node proxy-server.js
   ```

3. **The proxy will start on `http://localhost:3000`**

## Usage

Once the proxy is running:

1. Open your browser app (`index.html`)
2. Select "FutureLinks.ai" as TTS provider
3. Enter your FutureLinks.ai API key
4. Click "Test" - it should now work!

The browser app is already configured to use the proxy at `http://localhost:3000/api/tts` instead of directly calling `https://upliftai.org/api/tts`.

## How it works

```
Browser App → http://localhost:3000/api/tts (Proxy) → https://upliftai.org/api/tts (FutureLinks.ai)
                     ↑ CORS enabled                           ↑ No CORS
```

The proxy:
1. Receives requests from your browser (CORS enabled)
2. Forwards them to FutureLinks.ai API
3. Returns the audio response back to your browser

## Endpoints

- `GET /` - Health check, shows proxy status
- `POST /api/tts` - TTS endpoint (forwards to FutureLinks.ai)

## Troubleshooting

### Port already in use
If port 3000 is already in use, edit `proxy-server.js` and change:
```javascript
const PORT = 3000;  // Change to 3001, 3002, etc.
```

Then update `js/components/ConversationService.js`:
```javascript
this.futurelinksEndpoint = 'http://localhost:3001/api/tts';  // Match your port
```

### Proxy not starting
Make sure you've installed dependencies:
```bash
npm install
```

### API still not working
1. Check the proxy server console for error messages
2. Check your browser console (F12) for errors
3. Verify your FutureLinks.ai API key is correct
4. Make sure the proxy server is running before testing

## Production Deployment

For production, you would:
1. Deploy the proxy server to a cloud service (Heroku, AWS, etc.)
2. Update the `futurelinksEndpoint` to your deployed proxy URL
3. Add authentication/rate limiting to the proxy

For now, this local proxy is perfect for development and testing!
