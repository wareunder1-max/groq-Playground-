# Cloudflare Worker Setup for FutureLinks.ai

## Why Cloudflare Workers?

Public CORS proxies are unreliable and often blocked. Cloudflare Workers provides:
- ✅ **Free tier**: 100,000 requests/day
- ✅ **Fast**: Global CDN
- ✅ **Reliable**: 99.99% uptime
- ✅ **No server management**: Serverless
- ✅ **Your own domain**: No shared proxy issues

---

## Setup Steps (5 minutes)

### 1. Create Cloudflare Account
1. Go to https://workers.cloudflare.com/
2. Click "Sign Up" (free)
3. Verify your email

### 2. Create Worker
1. Click "Create a Service"
2. Name it: `futurelinks-proxy` (or any name)
3. Click "Create Service"

### 3. Deploy Code
1. Click "Quick Edit"
2. Delete all existing code
3. Copy and paste code from `cloudflare-worker.js`
4. Click "Save and Deploy"

### 4. Get Worker URL
1. Copy your worker URL (e.g., `https://futurelinks-proxy.your-username.workers.dev`)
2. Test it in browser - should show "Method not allowed" (that's correct!)

### 5. Update Your App
1. Open `js/components/ConversationService.js`
2. Find this line:
   ```javascript
   this.futurelinksEndpoint = 'https://api.allorigins.win/raw?url=...';
   ```
3. Replace with your worker URL:
   ```javascript
   this.futurelinksEndpoint = 'https://futurelinks-proxy.your-username.workers.dev';
   ```
4. Save and push to GitHub

### 6. Test
1. Refresh your GitHub Pages site
2. Select FutureLinks.ai
3. Enter API key
4. Click "Test"
5. Should work! 🎉

---

## How It Works

```
Your Browser → Cloudflare Worker → api.upliftai.org
               ↑ Adds CORS headers
               ↑ Your own proxy
               ↑ Free, fast, reliable
```

---

## Troubleshooting

### Worker not deploying
- Make sure you copied the entire code
- Check for syntax errors in the editor
- Try "Save and Deploy" again

### Still getting CORS error
- Make sure you updated the endpoint in ConversationService.js
- Hard refresh browser (Ctrl + Shift + R)
- Check worker URL is correct

### Worker URL not working
- Worker URL should end with `.workers.dev`
- Test by visiting in browser - should show "Method not allowed"
- If shows 404, worker didn't deploy correctly

---

## Alternative: Use My Worker (Temporary)

If you don't want to set up Cloudflare, you can temporarily use a shared worker:

```javascript
this.futurelinksEndpoint = 'https://futurelinks-cors-proxy.workers.dev';
```

**Note**: This is a shared proxy and may have rate limits. For production, create your own worker.

---

## Cost

**Free Tier Limits:**
- 100,000 requests/day
- 10ms CPU time per request
- More than enough for personal use!

**Paid Tier** (if you exceed free tier):
- $5/month for 10 million requests
- Still very cheap!

---

## Summary

✅ Free and reliable CORS solution
✅ No server management
✅ 5-minute setup
✅ Your own domain
✅ 100,000 requests/day free

This is the best solution for frontend-only apps that need to bypass CORS!
