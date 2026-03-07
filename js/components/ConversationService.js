/**
 * ConversationService Component
 * Manages AI conversation using Groq's chat completion API and text-to-speech
 */

class ConversationService {
  constructor(apiKey, elevenlabsKey = null) {
    this.apiKey = apiKey;
    this.elevenlabsKey = elevenlabsKey;
    this.apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    this.elevenlabsEndpoint = 'https://api.elevenlabs.io/v1/text-to-speech';
    this.conversationHistory = [];
    this.speechSynthesis = window.speechSynthesis;
    this.isSpeaking = false;
    this.selectedVoice = null;
    this.availableVoices = [];
    this.useElevenLabs = false;
    this.forceLocalTts = false;
    this.elevenlabsVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah (natural female voice)
    this.responseStyle = 'short'; // Default to short & casual
    
    // Load voices when available
    this.loadVoices();
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.availableVoices = this.speechSynthesis.getVoices();
    console.log('Available voices:', this.availableVoices.length);
    
    // Try to select a good default voice
    if (!this.selectedVoice && this.availableVoices.length > 0) {
      // Prefer Google voices, then Microsoft, then any English voice
      this.selectedVoice = this.availableVoices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
      ) || this.availableVoices.find(v => 
        v.lang.startsWith('en') && v.name.includes('Microsoft')
      ) || this.availableVoices.find(v => 
        v.lang.startsWith('en')
      ) || this.availableVoices[0];
      
      console.log('Selected default voice:', this.selectedVoice?.name);
    }
  }

  /**
   * Get available voices
   * @returns {Array} Available speech synthesis voices
   */
  getAvailableVoices() {
    return this.availableVoices;
  }

  /**
   * Set voice by name
   * @param {string} voiceName - Name of the voice to use
   */
  setVoice(voiceName) {
    const voice = this.availableVoices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      console.log('Voice changed to:', voice.name);
    }
  }

  /**
   * Send message to AI and get response
   * @param {string} userMessage - User's message text
   * @param {string} model - Groq model name (default: 'llama-3.3-70b-versatile')
   * @returns {Promise<string>} AI response text
   */
  async sendMessage(userMessage, model = 'llama-3.3-70b-versatile') {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      // Add system message if this is the first user message
      const systemPrompts = {
        short: 'You are a helpful multilingual AI assistant. Keep responses SHORT (1-2 sentences max). Be casual and conversational. You can speak English, Urdu, Punjabi, Sindhi, Pashto, and Arabic. When users ask to switch languages, respond naturally in that language.',
        normal: 'You are a helpful multilingual AI assistant. You can speak English, Urdu, Punjabi, Sindhi, Pashto, and Arabic. When users ask to switch languages, respond naturally in that language. Be conversational and friendly.',
        detailed: 'You are a helpful multilingual AI assistant. Provide detailed, thorough responses. You can speak English, Urdu, Punjabi, Sindhi, Pashto, and Arabic. When users ask to switch languages, respond naturally in that language. Be conversational and comprehensive.'
      };
      
      const messages = this.conversationHistory.length === 1 
        ? [
            {
              role: 'system',
              content: systemPrompts[this.responseStyle] || systemPrompts.short
            },
            ...this.conversationHistory
          ]
        : this.conversationHistory;

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      throw new Error(`Conversation failed: ${error.message}`);
    }
  }

  /**
   * Speak text using browser's text-to-speech or ElevenLabs
   * @param {string} text - Text to speak
   * @returns {Promise<void>}
   */
  async speak(text) {
    // Force local TTS if checkbox is checked
    if (this.forceLocalTts) {
      console.log('🔊 Using Browser TTS (forced):', this.selectedVoice?.name || 'Default voice');
      return this.speakWithBrowser(text);
    }
    
    // Use ElevenLabs if API key is configured
    if (this.elevenlabsKey && this.useElevenLabs) {
      console.log('🎙️ Using ElevenLabs TTS');
      return this.speakWithElevenLabs(text);
    }
    
    // Fallback to browser TTS
    console.log('🔊 Using Browser TTS:', this.selectedVoice?.name || 'Default voice');
    return this.speakWithBrowser(text);
  }

  /**
   * Speak using ElevenLabs API
   * @param {string} text - Text to speak
   * @returns {Promise<void>}
   */
  async speakWithElevenLabs(text) {
    try {
      const endpoint = `${this.elevenlabsEndpoint}/${this.elevenlabsVoiceId}`;
      
      console.log('📡 Sending to ElevenLabs API...');
      console.log('   Endpoint:', endpoint);
      console.log('   Voice ID:', this.elevenlabsVoiceId);
      console.log('   API Key (first 10 chars):', this.elevenlabsKey?.substring(0, 10) + '...');
      console.log('   Text length:', text.length, 'characters');
      
      const requestBody = {
        text: text,
        model_id: 'eleven_turbo_v2_5',  // Free tier compatible model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      };
      
      console.log('   Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenlabsKey
        },
        body: JSON.stringify(requestBody)
      });

      console.log('   Response status:', response.status);
      console.log('   Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        // Try to get error details from response
        const errorText = await response.text();
        console.error('   Error response body:', errorText);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      console.log('✅ ElevenLabs audio received, playing...');
      const audioBlob = await response.blob();
      console.log('   Audio blob size:', audioBlob.size, 'bytes');
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.isSpeaking = false;
          console.log('✅ ElevenLabs playback finished');
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
      console.error('❌ ElevenLabs TTS failed, falling back to browser TTS:', error);
      return this.speakWithBrowser(text);
    }
  }

  /**
   * Speak using browser's text-to-speech
   * @param {string} text - Text to speak
   * @returns {Promise<void>}
   */
  speakWithBrowser(text) {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Text-to-speech not supported in this browser'));
        return;
      }

      // Cancel any ongoing speech
      this.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;  // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      // Use selected voice
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (error) => {
        this.isSpeaking = false;
        reject(error);
      };

      this.isSpeaking = true;
      this.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  stopSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   * @returns {Array} Conversation messages
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Get a greeting message for new conversation
   * @returns {Promise<string>} Greeting message
   */
  async getGreeting() {
    // Determine which TTS is being used
    const usingElevenLabs = !this.forceLocalTts && this.elevenlabsKey && this.useElevenLabs;
    
    let greeting;
    if (usingElevenLabs) {
      greeting = "Hello there! This is Groq speech-to-text and ElevenLabs text-to-speech testing tool. I can speak multiple languages including Urdu, English, Punjabi, Sindhi, Pashto, and Arabic. Which language would you like to talk in?";
    } else {
      greeting = "Hello there! This is a speech-to-text and text-to-speech testing tool using browser voices. I can speak multiple languages including Urdu, English, Punjabi, Sindhi, Pashto, and Arabic. Which language would you like to talk in?";
    }
    
    return greeting;
  }

  /**
   * Update API key
   * @param {string} apiKey - New Groq API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Set ElevenLabs API key
   * @param {string} apiKey - ElevenLabs API key
   */
  setElevenlabsKey(apiKey) {
    this.elevenlabsKey = apiKey;
    this.useElevenLabs = !!apiKey;
    console.log('ElevenLabs TTS:', this.useElevenLabs ? 'enabled' : 'disabled');
  }

  /**
   * Set force local TTS
   * @param {boolean} force - Whether to force local browser TTS
   */
  setForceLocalTts(force) {
    this.forceLocalTts = force;
    console.log('Force local TTS set to:', force);
  }

  /**
   * Set response style
   * @param {string} style - 'short', 'normal', or 'detailed'
   */
  setResponseStyle(style) {
    this.responseStyle = style;
    console.log('Response style set to:', style);
  }

  /**
   * Set ElevenLabs voice
   * @param {string} voiceId - ElevenLabs voice ID
   */
  setElevenlabsVoice(voiceId) {
    this.elevenlabsVoiceId = voiceId;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConversationService;
}
