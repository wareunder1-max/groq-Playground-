# FutureLinks.ai CORS Issue - Solution

## The Problem

You're seeing this CORS error:
```
Access to fetch at 'https://upliftai.org/api/tts' from origin 'https://wareunder1-max.github.io' 
has been blocked by CORS policy
```

## Why This Happens

The FutureLinks.ai API (`upliftai.org`) doesn't allow browser requests from other domains (no CORS headers). This is a security restriction on their server.

## The Solution: Use Local File Instead of GitHub Pages

**IMPORTANT**: The proxy server (`http://localhost:3000`) only works when you open the HTML file LOCALLY, not from GitHub Pages.

### Step-by-Step Fix:

1. **Make sure the proxy server is running:**
   ```bash
   npm run proxy
   ```
   
   You should see:
   ```
   🚀 FutureLinks.ai TTS Proxy Server started
   📍 Listening on http://localhost:3000
   ```

2. **Open the HTML file LOCALLY** (not from GitHub Pages):
   
   **Option A - File Path (Recommended):**
   ```
   file:///C:/Users/user/Desktop/nProPhonyWEB/groq-Playground-/index.html
   ```
   
   **Option B - Local Server:**
   ```bash
   # In the project root directory
   npx http-server -p 8080
   ```
   Then open: `http://localhost:8080/index.html`

3. **Hard refresh the browser** to clear cache:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

4. **Test FutureLinks.ai:**
   - Select "FutureLinks.ai" from TTS Provider dropdown
   - Enter your API key
   - Click "Save"
   - Click "Test"

## Why GitHub Pages Won't Work

```
❌ GitHub Pages (HTTPS) → http://localhost:3000 (HTTP)
   - Mixed content blocked by browser
   - localhost not accessible from internet

✅ Local File → http://localhost:3000 (HTTP)
   - Same machine, works perfectly
   - No mixed content issues
```

## Alternative: Deploy Proxy to Cloud

If you want to use GitHub Pages, you need to deploy the proxy server to a cloud service:

1. **Deploy proxy to Heroku/Railway/Render** (free tier available)
2. **Update the endpoint** in `js/components/ConversationService.js`:
   ```javascript
   this.futurelinksEndpoint = 'https://your-proxy.herokuapp.com/api/tts';
   ```
3. **Push to GitHub** and GitHub Pages will work

## Quick Test

To verify the proxy is working locally:

1. Open browser console (F12)
2. Run this test:
   ```javascript
   fetch('http://localhost:3000/')
     .then(r => r.json())
     .then(d => console.log('Proxy status:', d))
   ```
   
   Should show:
   ```json
   {
     "status": "running",
     "message": "FutureLinks.ai TTS Proxy Server"
   }
   ```

## Summary

**For Local Testing (Current Setup):**
- ✅ Use `file:///` path or `http://localhost:8080`
- ✅ Proxy server on `http://localhost:3000`
- ✅ Works perfectly

**For GitHub Pages (Requires Cloud Deployment):**
- ❌ Can't use `http://localhost:3000` from HTTPS site
- ✅ Deploy proxy to cloud with HTTPS
- ✅ Update endpoint to cloud URL

**Current Recommendation:** Use local file path for testing. It's the simplest solution and works immediately!
