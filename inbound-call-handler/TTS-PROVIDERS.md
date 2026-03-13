# TTS Providers Configuration

## Overview

The web interface (index.html) supports multiple TTS providers for flexibility and quality comparison.

**Note**: This is for the web-based Speech-to-Text app, NOT the inbound call handler.

---

## Supported TTS Providers

### 1. Browser TTS (Default/Fallback)
**API**: Native browser `speechSynthesis` API
**Cost**: Free
**Quality**: Varies by browser and OS
**Languages**: Depends on system voices
**Status**: Always available

### 2. ElevenLabs (Primary)
**API**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
**Voice ID**: `EXAVITQu4vr4xnSDxMaL` (Sarah - default)
**Model**: `eleven_turbo_v2_5`
**Cost**: ~$0.003 per request
**Quality**: Excellent for English and Urdu
**Status**: Currently active

### 3. FutureLinks.ai (Secondary)
**API**: `https://upliftai.org/api/tts` (white-labeled as FutureLinks.ai)
**Backend**: upliftai.org (internal reference only)
**Voice ID**: TBD
**Model**: TBD
**Cost**: TBD
**Quality**: TBD
**Status**: To be integrated

**Important**: All user-facing UI and documentation should reference "FutureLinks.ai", not "upliftai.org"

---

## UI Changes Needed (For Tomorrow)

### Step 1: Update index.html - Add TTS Provider Selector

```html
<!-- Text-to-Speech Provider Selection -->
<div class="input-group">
  <label>Text-to-Speech Provider:</label>
  <select id="tts-provider-select" class="select-input">
    <option value="browser">Browser TTS (Free)</option>
    <option value="elevenlabs">ElevenLabs</option>
    <option value="futurelinks">FutureLinks.ai</option>
  </select>
</div>

<!-- ElevenLabs Configuration (shown when ElevenLabs selected) -->
<div id="elevenlabs-config" class="input-group" style="display: none;">
  <input id="elevenlabs-key-input" type="password" placeholder="ElevenLabs API Key">
  <button id="save-elevenlabs-key-btn" class="btn-small">Save</button>
  <button id="test-elevenlabs-btn" class="btn-small btn-test">Test</button>
</div>

<div id="elevenlabs-voice-config" class="input-group" style="display: none;">
  <select id="elevenlabs-voice-select" class="select-input">
    <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Female)</option>
    <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female)</option>
    <option value="2EiwWnXFnvU5JabPnv8n">Clyde (Male)</option>
  </select>
</div>

<!-- FutureLinks.ai Configuration (shown when FutureLinks selected) -->
<div id="futurelinks-config" class="input-group" style="display: none;">
  <input id="futurelinks-key-input" type="password" placeholder="FutureLinks.ai API Key">
  <button id="save-futurelinks-key-btn" class="btn-small">Save</button>
  <button id="test-futurelinks-btn" class="btn-small btn-test">Test</button>
</div>

<div id="futurelinks-voice-config" class="input-group" style="display: none;">
  <select id="futurelinks-voice-select" class="select-input">
    <option value="voice1">Voice 1</option>
    <option value="voice2">Voice 2</option>
    <!-- Add FutureLinks voices here -->
  </select>
</div>
```

### Step 2: Update ConversationService.js - Add FutureLinks Support

```javascript
class ConversationService {
  constructor(apiKey, elevenlabsKey = null, futurelinksKey = null) {
    this.apiKey = apiKey;
    this.elevenlabsKey = elevenlabsKey;
    this.futurelinksKey = futurelinksKey;
    this.ttsProvider = 'browser'; // 'browser', 'elevenlabs', 'futurelinks'
    this.futurelinksEndpoint = 'https://upliftai.org/api/tts';
    this.futurelinksVoiceId = 'default';
    // ... rest of constructor
  }

  /**
   * Set TTS provider
   * @param {string} provider - 'browser', 'elevenlabs', or 'futurelinks'
   */
  setTtsProvider(provider) {
    this.ttsProvider = provider;
    console.log('TTS provider set to:', provider);
  }

  /**
   * Set FutureLinks API key
   * @param {string} apiKey - FutureLinks.ai API key
   */
  setFuturelinksKey(apiKey) {
    this.futurelinksKey = apiKey;
    console.log('FutureLinks.ai TTS:', apiKey ? 'enabled' : 'disabled');
  }

  /**
   * Set FutureLinks voice
   * @param {string} voiceId - FutureLinks voice ID
   */
  setFuturelinksVoice(voiceId) {
    this.futurelinksVoiceId = voiceId;
  }

  /**
   * Main speak function - routes to appropriate TTS provider
   * @param {string} text - Text to speak
   * @returns {Promise<void>}
   */
  async speak(text) {
    switch (this.ttsProvider) {
      case 'elevenlabs':
        if (this.elevenlabsKey) {
          return this.speakWithElevenLabs(text);
        }
        break;
      
      case 'futurelinks':
        if (this.futurelinksKey) {
          return this.speakWithFutureLinks(text);
        }
        break;
      
      case 'browser':
      default:
        return this.speakWithBrowser(text);
    }
    
    // Fallback to browser if selected provider not available
    console.log('Selected TTS provider not available, falling back to browser');
    return this.speakWithBrowser(text);
  }

  /**
   * Speak using FutureLinks.ai API (upliftai.org backend)
   * @param {string} text - Text to speak
   * @returns {Promise<void>}
   */
  async speakWithFutureLinks(text) {
    try {
      console.log('🎙️ Using FutureLinks.ai TTS');
      console.log('   Backend: upliftai.org');
      console.log('   Voice ID:', this.futurelinksVoiceId);
      
      const response = await fetch(this.futurelinksEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.futurelinksKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice_id: this.futurelinksVoiceId,
          // Add other required parameters based on upliftai.org API docs
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FutureLinks.ai API error: ${response.status} - ${errorText}`);
      }

      console.log('✅ FutureLinks.ai audio received, playing...');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.isSpeaking = false;
          console.log('✅ FutureLinks.ai playback finished');
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          this.isSpeaking = false;
          console.error('   Audio playback error:', error);
          reject(error);
        };

        this.isSpeaking = true;
        audio.play();
      });
    } catch (error) {
      console.error('❌ FutureLinks.ai TTS failed, falling back to browser TTS:', error);
      return this.speakWithBrowser(text);
    }
  }
}
```

### Step 3: Update UIController.js - Add FutureLinks Event Handlers

```javascript
// Add to _setupEventListeners():

// TTS Provider selector
this.elements.ttsProviderSelect.addEventListener('change', (e) => {
  this.handleTtsProviderChange(e.target.value);
});

// FutureLinks API key save button
this.elements.saveFuturelinksKeyBtn.addEventListener('click', () => {
  this.handleFuturelinksKeySubmit(this.elements.futurelinksKeyInput.value);
});

// FutureLinks key input - allow Enter key to submit
this.elements.futurelinksKeyInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    this.handleFuturelinksKeySubmit(this.elements.futurelinksKeyInput.value);
  }
});

// Test FutureLinks API button
this.elements.testFuturelinksBtn.addEventListener('click', () => {
  this.handleTestFuturelinks();
});

// FutureLinks voice selector
this.elements.futurelinksVoiceSelect.addEventListener('change', (e) => {
  this.conversationService.setFuturelinksVoice(e.target.value);
  console.log('FutureLinks voice changed to:', e.target.options[e.target.selectedIndex].text);
});

// Add new methods:

/**
 * Handle TTS provider change
 * @param {string} provider - Selected TTS provider
 */
handleTtsProviderChange(provider) {
  this.conversationService.setTtsProvider(provider);
  
  // Show/hide provider-specific config sections
  document.getElementById('elevenlabs-config').style.display = 
    provider === 'elevenlabs' ? 'block' : 'none';
  document.getElementById('elevenlabs-voice-config').style.display = 
    provider === 'elevenlabs' ? 'block' : 'none';
  
  document.getElementById('futurelinks-config').style.display = 
    provider === 'futurelinks' ? 'block' : 'none';
  document.getElementById('futurelinks-voice-config').style.display = 
    provider === 'futurelinks' ? 'block' : 'none';
  
  console.log('TTS provider changed to:', provider);
}

/**
 * Handle FutureLinks API key submission
 * @param {string} apiKey - The FutureLinks.ai API key to save
 */
handleFuturelinksKeySubmit(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    localStorage.removeItem('futurelinksApiKey');
    this.conversationService.setFuturelinksKey(null);
    
    const originalText = this.elements.saveFuturelinksKeyBtn.textContent;
    this.elements.saveFuturelinksKeyBtn.textContent = 'Cleared!';
    setTimeout(() => {
      this.elements.saveFuturelinksKeyBtn.textContent = originalText;
    }, 2000);
    return;
  }

  localStorage.setItem('futurelinksApiKey', apiKey.trim());
  this.conversationService.setFuturelinksKey(apiKey.trim());

  const originalText = this.elements.saveFuturelinksKeyBtn.textContent;
  this.elements.saveFuturelinksKeyBtn.textContent = 'Saved!';
  setTimeout(() => {
    this.elements.saveFuturelinksKeyBtn.textContent = originalText;
  }, 2000);
}

/**
 * Test FutureLinks.ai API connection
 */
async handleTestFuturelinks() {
  const apiKey = this.elements.futurelinksKeyInput.value.trim();
  
  if (!apiKey) {
    this.displayError('Please enter a FutureLinks.ai API key first');
    return;
  }

  const originalText = this.elements.testFuturelinksBtn.textContent;
  this.elements.testFuturelinksBtn.textContent = 'Testing...';
  this.elements.testFuturelinksBtn.disabled = true;
  this.elements.errorDisplay.style.display = 'none';

  try {
    this.conversationService.setFuturelinksKey(apiKey);
    const originalProvider = this.conversationService.ttsProvider;
    this.conversationService.ttsProvider = 'futurelinks';
    
    await this.conversationService.speak('Testing FutureLinks AI connection');
    
    this.conversationService.ttsProvider = originalProvider;
    this.elements.futurelinksVoiceSelect.disabled = false;
    this.elements.testFuturelinksBtn.textContent = '✓ Success!';
    this.elements.errorDisplay.style.display = 'none';
    
    this.elements.statusDisplay.textContent = '✓ FutureLinks.ai API verified successfully!';
    this.elements.statusDisplay.style.background = '#e8f5e9';
    this.elements.statusDisplay.style.color = '#1b5e20';
    
    setTimeout(() => {
      this.elements.testFuturelinksBtn.textContent = originalText;
      this.elements.testFuturelinksBtn.disabled = false;
      this.updateStatus('ready');
    }, 3000);
  } catch (error) {
    this.elements.futurelinksVoiceSelect.disabled = true;
    this.elements.testFuturelinksBtn.textContent = '✗ Failed';
    this.displayError('❌ FutureLinks.ai Test Failed: ' + error.message);
    
    setTimeout(() => {
      this.elements.testFuturelinksBtn.textContent = originalText;
      this.elements.testFuturelinksBtn.disabled = false;
    }, 3000);
  }
}
```

---

## Benefits of Multi-Provider Support

✅ **User choice** - Let users pick their preferred TTS provider
✅ **Cost flexibility** - Compare pricing across providers
✅ **Quality comparison** - Test which provider sounds better for different languages
✅ **Fallback support** - If one provider fails, try browser TTS
✅ **White-labeling** - FutureLinks.ai branding for upliftai.org backend

---

## LocalStorage Keys

```javascript
// STT Configuration
localStorage.setItem('sttProvider', 'groq');
localStorage.setItem('sttApiKey', 'your_groq_key');

// TTS Configuration
localStorage.setItem('ttsProvider', 'elevenlabs'); // 'browser', 'elevenlabs', 'futurelinks'
localStorage.setItem('elevenlabsApiKey', 'your_elevenlabs_key');
localStorage.setItem('elevenlabsVoiceId', 'EXAVITQu4vr4xnSDxMaL');
localStorage.setItem('futurelinksApiKey', 'your_futurelinks_key');
localStorage.setItem('futurelinksVoiceId', 'voice1');
```

---

## Next Steps (Tomorrow)

1. ✅ Get FutureLinks.ai (upliftai.org) API documentation
2. ✅ Update index.html with TTS provider selector
3. ✅ Add FutureLinks config sections (hidden by default)
4. ✅ Update ConversationService.js with FutureLinks support
5. ✅ Update UIController.js with event handlers
6. ✅ Test FutureLinks.ai API with sample text
7. ✅ Compare quality: Browser vs ElevenLabs vs FutureLinks
8. ✅ Update localStorage handling for new provider

---

## Notes

- **FutureLinks.ai** is the user-facing brand name
- **upliftai.org** is the backend API (internal reference only)
- All UI text should say "FutureLinks.ai"
- API endpoint: `https://upliftai.org/api/tts`
- Keep upliftai.org references in code comments only
- User never sees "upliftai" in the interface

