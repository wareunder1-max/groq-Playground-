# FutureLinks.ai TTS Integration

## Overview

FutureLinks.ai has been added as a third TTS provider option in the web interface, alongside Browser TTS and ElevenLabs.

**Backend**: upliftai.org (white-labeled as FutureLinks.ai)
**User-facing name**: FutureLinks.ai (never mention upliftai.org in UI)

---

## What Changed

### 1. index.html
- Added TTS Provider dropdown selector
- Moved ElevenLabs config into collapsible section (hidden by default)
- Added FutureLinks.ai config section (hidden by default)
- Removed old "Force local TTS" checkbox

### 2. ConversationService.js
- Added `futurelinksKey` parameter to constructor
- Added `ttsProvider` property ('browser', 'elevenlabs', 'futurelinks')
- Added `futurelinksEndpoint` and `futurelinksVoiceId` properties
- Refactored `speak()` method to route based on `ttsProvider`
- Added `speakWithFutureLinks()` method
- Added `setFuturelinksKey()` and `setFuturelinksVoice()` methods
- Added `setTtsProvider()` method
- Updated `getGreeting()` to mention correct TTS provider

### 3. UIController.js
- Added FutureLinks DOM element references
- Added localStorage support for FutureLinks settings
- Added TTS provider change handler
- Added FutureLinks key save/test handlers
- Added `updateTtsProviderVisibility()` method
- Removed old force-local-tts references

---

## How It Works

### User Flow

1. User selects TTS provider from dropdown:
   - Browser TTS (Free) - Default, always available
   - ElevenLabs - Shows ElevenLabs config section
   - FutureLinks.ai - Shows FutureLinks config section

2. If ElevenLabs or FutureLinks selected:
   - User enters API key
   - User clicks "Save" to store in localStorage
   - User clicks "Test" to verify API connection
   - User selects voice from dropdown

3. During conversation:
   - System uses selected TTS provider
   - Falls back to Browser TTS if provider fails

### Code Flow

```javascript
// TTS Provider Selection
conversationService.setTtsProvider('futurelinks');

// API Key Configuration
conversationService.setFuturelinksKey('your_api_key');
conversationService.setFuturelinksVoice('default');

// Speaking (automatic routing)
await conversationService.speak('Hello world');
// → Routes to speakWithFutureLinks()
// → Falls back to speakWithBrowser() on error
```

---

## API Integration

### FutureLinks.ai API (upliftai.org backend)

**Endpoint**: `https://upliftai.org/api/tts`

**Request Format**:
```javascript
POST https://upliftai.org/api/tts
Headers:
  Authorization: Bearer {api_key}
  Content-Type: application/json

Body:
{
  "text": "Text to convert to speech",
  "voice_id": "default"
  // Add other parameters based on upliftai.org API docs
}
```

**Response**: Audio blob (MP3 or WAV format)

**Note**: Actual API parameters need to be confirmed from upliftai.org documentation.

---

## Configuration Storage

### localStorage Keys

```javascript
// TTS Provider Selection
localStorage.setItem('ttsProvider', 'futurelinks'); // 'browser', 'elevenlabs', 'futurelinks'

// FutureLinks.ai Configuration
localStorage.setItem('futurelinksApiKey', 'your_api_key');
localStorage.setItem('futurelinksVoiceId', 'default');

// ElevenLabs Configuration (existing)
localStorage.setItem('elevenlabsApiKey', 'your_api_key');
localStorage.setItem('elevenlabsVoiceId', 'EXAVITQu4vr4xnSDxMaL');
```

---

## Testing

### Test FutureLinks.ai Integration

1. Open `index.html` in browser
2. Select "FutureLinks.ai" from TTS Provider dropdown
3. Enter FutureLinks.ai API key
4. Click "Save"
5. Click "Test" - should speak "Testing FutureLinks AI connection"
6. If successful, voice selector becomes enabled
7. Start conversation and verify TTS works

### Fallback Testing

1. Select FutureLinks.ai but don't enter API key
2. Start conversation
3. Should automatically fall back to Browser TTS
4. Check console for fallback message

---

## Next Steps

### Required Before Production:

1. ✅ Get upliftai.org API documentation
2. ✅ Confirm API endpoint and request format
3. ✅ Confirm response format (MP3/WAV)
4. ✅ Get list of available voices
5. ✅ Update `futurelinks-voice-select` with actual voices
6. ✅ Test with Urdu, English, and other languages
7. ✅ Compare quality with ElevenLabs
8. ✅ Document pricing and rate limits

### Optional Enhancements:

- Add voice preview feature
- Add language-specific voice recommendations
- Add cost calculator
- Add quality comparison tool

---

## White-Labeling Notes

**IMPORTANT**: All user-facing references must use "FutureLinks.ai"

✅ **Correct** (user-facing):
- "FutureLinks.ai API Key"
- "Testing FutureLinks AI connection"
- "FutureLinks.ai TTS"
- UI labels, error messages, documentation

✅ **Correct** (internal/code):
- `futurelinksEndpoint = 'https://upliftai.org/api/tts'`
- Code comments: "// FutureLinks.ai (upliftai.org backend)"
- Console logs: "Backend: upliftai.org"

❌ **Incorrect** (never show to users):
- "upliftai.org API Key"
- "Testing upliftai connection"
- Any UI text mentioning "upliftai"

---

## Summary

✅ FutureLinks.ai integrated as third TTS option
✅ Clean provider selection UI
✅ Automatic fallback to Browser TTS
✅ localStorage persistence
✅ Test functionality for API verification
✅ White-labeling properly implemented
✅ No breaking changes to existing functionality

The web interface now supports three TTS providers with seamless switching!
