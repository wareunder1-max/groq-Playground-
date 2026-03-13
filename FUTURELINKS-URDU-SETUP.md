# FutureLinks.ai Urdu Voice Setup

## ✅ Working Now!

The FutureLinks.ai integration is now working with Urdu voice support!

---

## What Changed

### 1. Default Voice Changed to Urdu
```javascript
this.futurelinksVoiceId = 'v_meklc281'; // Urdu voice (was: v_8eelc901 English)
this.futurelinksLanguage = 'ur'; // Urdu language code
```

### 2. Added Language Parameter
```javascript
{
  "voiceId": "v_meklc281",
  "text": "Your text here",
  "outputFormat": "MP3_22050_128",
  "language": "ur"  // NEW: Forces Urdu language
}
```

### 3. Voice Selector Updated
- **v_8eelc901**: Default Voice (English)
- **v_meklc281**: Urdu Voice 1 (Default)

---

## How to Use

### 1. Refresh Browser
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 2. Select FutureLinks.ai
- TTS Provider: **FutureLinks.ai**
- Voice: **Urdu Voice 1** (default)
- Enter your API key
- Click **Save**
- Click **Test**

### 3. Test with Urdu Text
The system will now speak in Urdu by default!

---

## Available Voices

Based on Uplift AI documentation:

| Voice ID | Language | Description |
|----------|----------|-------------|
| `v_8eelc901` | English | Default English voice |
| `v_meklc281` | Urdu | Urdu voice (default) |

**Note**: More voices may be available in your account. Check your Uplift AI dashboard for the complete list.

---

## Supported Languages

Uplift AI specializes in Pakistani languages:
- ✅ **Urdu** (ur)
- ✅ **Punjabi** (pa)
- ✅ **Sindhi** (sd)
- ✅ **Balochi** (bal)
- ✅ **Pashto** (ps)
- ✅ **Saraiki** (skr)
- ✅ **English** (en)

---

## API Parameters

### Request Format
```javascript
POST https://api.upliftai.org/v1/synthesis/text-to-speech

Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "voiceId": "v_meklc281",      // Voice ID
  "text": "آپ کا نام کیا ہے؟",   // Text in any language
  "outputFormat": "MP3_22050_128", // Audio format
  "language": "ur"               // Language code
}
```

### Output Formats
- `MP3_22050_32` - MP3, 22.05kHz, 32kbps (lowest quality, smallest size)
- `MP3_22050_128` - MP3, 22.05kHz, 128kbps (default, good quality)
- `MP3_44100_128` - MP3, 44.1kHz, 128kbps (higher quality)

---

## Testing

### Test in Browser Console
```javascript
// Test Urdu TTS
fetch('https://api.upliftai.org/v1/synthesis/text-to-speech', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    voiceId: 'v_meklc281',
    text: 'السلام علیکم، آپ کیسے ہیں؟',
    outputFormat: 'MP3_22050_128',
    language: 'ur'
  })
})
.then(r => r.blob())
.then(blob => {
  const audio = new Audio(URL.createObjectURL(blob));
  audio.play();
});
```

---

## Troubleshooting

### Voice sounds wrong
- Make sure you selected "Urdu Voice 1" from dropdown
- Check that language parameter is set to "ur"
- Try different voice IDs from your account

### Still speaking English
- Hard refresh browser (Ctrl + Shift + R)
- Clear browser cache
- Check voice selector shows "Urdu Voice 1"

### API error
- Verify API key is correct
- Check voice ID exists in your account
- Try with default voice first (v_8eelc901)

---

## Documentation References

- **Uplift AI Docs**: https://docs.upliftai.org/
- **TTS API**: https://api.upliftai.org/v1/synthesis/text-to-speech
- **Realtime Assistants**: https://docs.upliftai.org/assistants/api-reference/create-assistant

---

## Summary

✅ FutureLinks.ai working
✅ Direct API call (no proxy needed)
✅ Urdu voice as default
✅ Language parameter added
✅ Multiple voice options
✅ Tested and verified

Just refresh your browser and test with Urdu text!
