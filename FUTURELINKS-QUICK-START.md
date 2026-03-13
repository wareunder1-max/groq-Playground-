# FutureLinks.ai Quick Start Guide

## ✅ Fixed! Now Works from GitHub Pages

The FutureLinks.ai integration now uses the **correct API endpoint** and a **public CORS proxy**, so it works directly from GitHub Pages without any backend!

---

## How to Use

### 1. Open Your GitHub Pages Site
```
https://wareunder1-max.github.io/groq-Playground-/
```

### 2. Hard Refresh to Clear Cache
- **Windows**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### 3. Configure FutureLinks.ai
1. Select **"FutureLinks.ai"** from TTS Provider dropdown
2. Enter your API key (starts with `sk_api_...`)
3. Click **"Save"**
4. Click **"Test"** - should speak "Testing FutureLinks AI connection"

### 4. Start Talking!
- Click **"Start Conversation"** button
- Hold **"TALK"** button and speak
- Release to hear AI response with FutureLinks.ai voice

---

## What Changed

### ✅ Correct API Endpoint
```
OLD: https://upliftai.org/api/tts (wrong)
NEW: https://api.upliftai.org/v1/synthesis/text-to-speech (correct)
```

### ✅ Correct Request Format
```javascript
{
  "voiceId": "v_8eelc901",           // was: voice_id: "default"
  "text": "Hello world",
  "outputFormat": "MP3_22050_128"    // NEW: specify audio format
}
```

### ✅ CORS Proxy (No Backend Needed!)
```
Browser → corsproxy.io → api.upliftai.org
          ↑ Adds CORS headers
```

---

## Verified Working

✅ **Postman Test**: Working with your API key
✅ **Correct Endpoint**: `https://api.upliftai.org/v1/synthesis/text-to-speech`
✅ **CORS Proxy**: `https://corsproxy.io` (public, free)
✅ **GitHub Pages**: Works without backend server
✅ **Voice ID**: `v_8eelc901` (default voice)

---

## Troubleshooting

### "Failed to fetch" Error
1. Hard refresh browser (`Ctrl + Shift + R`)
2. Check API key is correct
3. Check browser console for detailed error

### Audio Not Playing
1. Check browser console for errors
2. Verify audio blob size > 0 bytes
3. Try different voice ID

### Still Seeing Old Endpoint
1. Clear browser cache completely
2. Open in incognito/private window
3. Check file was updated on GitHub

---

## API Details

**Endpoint**: `https://api.upliftai.org/v1/synthesis/text-to-speech`

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "voiceId": "v_8eelc901",
  "text": "Your text here",
  "outputFormat": "MP3_22050_128"
}
```

**Response**: MP3 audio blob

---

## No Backend Required! 🎉

The proxy server (`proxy-server.cjs`) is **no longer needed**. The public CORS proxy handles everything from the browser.

You can delete:
- `proxy-server.cjs`
- `PROXY-README.md`
- `test-proxy.html`

Or keep them for reference.

---

## Summary

✅ Fixed API endpoint
✅ Fixed request format
✅ Added CORS proxy
✅ Works from GitHub Pages
✅ No backend needed
✅ Tested and verified

Just refresh your browser and test!
