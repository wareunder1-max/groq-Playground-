/**
 * TranscriptionService Component
 * Manages API communication with multiple speech-to-text providers
 * 
 * Requirements: 2.1, 2.3, 3.1, 5.2, 5.3
 */

class TranscriptionService {
  /**
   * Create a new TranscriptionService instance
   * @param {string} apiKey - API key for authentication
   * @param {string} provider - Provider name ('groq', 'openai', 'deepgram')
   */
  constructor(apiKey, provider = 'groq') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.lastApiStats = null;
    this._updateEndpoint();
  }

  /**
   * Update API endpoint based on provider
   * @private
   */
  _updateEndpoint() {
    const endpoints = {
      groq: 'https://api.groq.com/openai/v1/audio/transcriptions',
      openai: 'https://api.openai.com/v1/audio/transcriptions',
      deepgram: 'https://api.deepgram.com/v1/listen'
    };
    this.apiEndpoint = endpoints[this.provider] || endpoints.groq;
  }

  /**
   * Set provider
   * @param {string} provider - Provider name
   */
  setProvider(provider) {
    this.provider = provider;
    this._updateEndpoint();
  }

  /**
   * Send audio to API for transcription
   * @param {Blob} audioBlob - Audio data to transcribe
   * @param {string} model - Model name (provider-specific)
   * @returns {Promise<string>} Transcribed text
   * @throws {Error} with message on API failure
   */
  async transcribe(audioBlob, model = null) {
    // Validate inputs
    if (!audioBlob || !(audioBlob instanceof Blob)) {
      throw new Error('Invalid audio data provided');
    }

    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    // Route to provider-specific method
    switch (this.provider) {
      case 'groq':
        return this._transcribeGroq(audioBlob, model || 'whisper-large-v3');
      case 'openai':
        return this._transcribeOpenAI(audioBlob, model || 'whisper-1');
      case 'deepgram':
        return this._transcribeDeepgram(audioBlob);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  /**
   * Transcribe using Groq Whisper API
   * @private
   */
  async _transcribeGroq(audioBlob, model) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', model);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      this._extractStats(response, audioBlob);
      const data = await response.json();
      
      if (data.duration) {
        this.lastApiStats.audioDurationSeconds = data.duration;
      }
      
      if (!data.text) {
        throw new Error('Invalid response format: missing text field');
      }

      return data.text;
    } catch (error) {
      throw this._handleTranscriptionError(error);
    }
  }

  /**
   * Transcribe using OpenAI Whisper API
   * @private
   */
  async _transcribeOpenAI(audioBlob, model) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', model);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      this._extractStats(response, audioBlob);
      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Invalid response format: missing text field');
      }

      return data.text;
    } catch (error) {
      throw this._handleTranscriptionError(error);
    }
  }

  /**
   * Transcribe using Deepgram API
   * @private
   */
  async _transcribeDeepgram(audioBlob) {
    try {
      const response = await fetch(`${this.apiEndpoint}?model=nova-2&smart_format=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'audio/webm'
        },
        body: audioBlob
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      this._extractStats(response, audioBlob);
      const data = await response.json();
      
      const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      if (!transcript) {
        throw new Error('Invalid response format: missing transcript');
      }

      return transcript;
    } catch (error) {
      throw this._handleTranscriptionError(error);
    }
  }

  /**
   * Extract stats from response
   * @private
   */
  _extractStats(response, audioBlob) {
    const requestsLimit = parseInt(response.headers.get('x-ratelimit-limit-requests')) || null;
    const requestsRemaining = parseInt(response.headers.get('x-ratelimit-remaining-requests')) || null;
    const tokensLimit = parseInt(response.headers.get('x-ratelimit-limit-tokens')) || null;
    const tokensRemaining = parseInt(response.headers.get('x-ratelimit-remaining-tokens')) || null;
    
    this.lastApiStats = {
      requestsLimit,
      requestsRemaining,
      tokensLimit,
      tokensRemaining,
      audioDuration: audioBlob.size / 1024,
      audioDurationSeconds: null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle transcription errors
   * @private
   */
  _handleTranscriptionError(error) {
    if (error.message.includes('Invalid API key') || 
        error.message.includes('Rate limit') ||
        error.message.includes('Service temporarily unavailable') ||
        error.message.includes('Invalid response format')) {
      return error;
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Error('Network error. Please check your connection and try again.');
    }

    return new Error(`Transcription failed: ${error.message}`);
  }

  /**
   * Update API key
   * @param {string} apiKey - New API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get last API call statistics
   * @returns {Object|null} API usage stats from last call
   */
  getLastApiStats() {
    return this.lastApiStats;
  }

  /**
   * Handle HTTP error responses from the API
   * @private
   * @param {Response} response - Fetch API response object
   * @throws {Error} with appropriate error message
   */
  async _handleErrorResponse(response) {
    const status = response.status;

    let errorMessage = '';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || '';
    } catch {
      // Ignore JSON parse errors
    }

    if (status === 401) {
      throw new Error('Invalid API key. Please check your API key and try again.');
    } else if (status === 429) {
      // Provide more helpful message for rate limits
      if (this.provider === 'openai') {
        throw new Error('Rate limit exceeded. OpenAI requires billing setup. Please add payment method at platform.openai.com/account/billing');
      }
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (status >= 500) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    } else {
      const message = errorMessage || `API request failed with status ${status}`;
      throw new Error(message);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranscriptionService;
}
