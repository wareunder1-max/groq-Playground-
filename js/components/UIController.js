/**
 * UIController Component
 * Manages all DOM interactions and coordinates AudioRecorder and TranscriptionService
 * 
 * Requirements: 3.2, 4.1, 4.2, 4.3, 4.4
 */

class UIController {
  constructor() {
    // DOM element references
    this.elements = {
      sttProviderSelect: null,
      apiKeyInput: null,
      saveApiKeyBtn: null,
      testApiKeyBtn: null,
      ttsProviderSelect: null,
      elevenlabsKeyInput: null,
      saveElevenlabsKeyBtn: null,
      testElevenlabsBtn: null,
      elevenlabsVoiceSelect: null,
      futurelinksKeyInput: null,
      saveFuturelinksKeyBtn: null,
      testFuturelinksBtn: null,
      futurelinksVoiceSelect: null,
      statusDisplay: null,
      talkBtn: null,
      conversationBtn: null,
      newConversationBtn: null,
      responseStyleSelect: null,
      voiceSelect: null,
      transcriptionOutput: null,
      resultSection: null,
      conversationSection: null,
      conversationHistory: null,
      errorDisplay: null,
      statsDisplay: null
    };

    // Component instances
    this.audioRecorder = null;
    this.transcriptionService = null;
    this.conversationService = null;

    // Application state
    this.state = {
      status: 'ready',
      hasApiKey: false,
      apiKeyTested: false,
      isRecording: false,
      conversationMode: false,
      sttProvider: 'groq'
    };
  }

  /**
   * Initialize the UI and set up event listeners
   */
  init() {
    // Get references to all DOM elements
    this.elements.sttProviderSelect = document.getElementById('stt-provider-select');
    this.elements.apiKeyInput = document.getElementById('api-key-input');
    this.elements.saveApiKeyBtn = document.getElementById('save-api-key-btn');
    this.elements.testApiKeyBtn = document.getElementById('test-api-key-btn');
    this.elements.ttsProviderSelect = document.getElementById('tts-provider-select');
    this.elements.elevenlabsKeyInput = document.getElementById('elevenlabs-key-input');
    this.elements.saveElevenlabsKeyBtn = document.getElementById('save-elevenlabs-key-btn');
    this.elements.testElevenlabsBtn = document.getElementById('test-elevenlabs-btn');
    this.elements.elevenlabsVoiceSelect = document.getElementById('elevenlabs-voice-select');
    this.elements.futurelinksKeyInput = document.getElementById('futurelinks-key-input');
    this.elements.saveFuturelinksKeyBtn = document.getElementById('save-futurelinks-key-btn');
    this.elements.testFuturelinksBtn = document.getElementById('test-futurelinks-btn');
    this.elements.futurelinksVoiceSelect = document.getElementById('futurelinks-voice-select');
    this.elements.statusDisplay = document.getElementById('status-display');
    this.elements.talkBtn = document.getElementById('talk-btn');
    this.elements.conversationBtn = document.getElementById('conversation-btn');
    this.elements.newConversationBtn = document.getElementById('new-conversation-btn');
    this.elements.responseStyleSelect = document.getElementById('response-style-select');
    this.elements.voiceSelect = document.getElementById('voice-select');
    this.elements.transcriptionOutput = document.getElementById('transcription-output');
    this.elements.resultSection = document.getElementById('result-section');
    this.elements.conversationSection = document.getElementById('conversation-section');
    this.elements.conversationHistory = document.getElementById('conversation-history');
    this.elements.errorDisplay = document.getElementById('error-display');
    this.elements.statsDisplay = document.getElementById('stats-display');

    // Verify all required elements exist
    if (!this._verifyDOMElements()) {
      console.error('Failed to initialize: Required DOM elements not found');
      return;
    }

    // Initialize AudioRecorder instance
    if (AudioRecorder.isSupported()) {
      this.audioRecorder = new AudioRecorder();
    } else {
      this.displayError('Your browser doesn\'t support audio recording. Please use a modern browser.');
      return;
    }

    // Initialize ConversationService
    this.conversationService = new ConversationService('');

    // Load API key from localStorage on startup
    const storedApiKey = localStorage.getItem('sttApiKey');
    const storedProvider = localStorage.getItem('sttProvider') || 'groq';
    const storedTtsProvider = localStorage.getItem('ttsProvider') || 'browser';
    const storedElevenlabsKey = localStorage.getItem('elevenlabsApiKey');
    const storedFuturelinksKey = localStorage.getItem('futurelinksApiKey');
    
    this.state.sttProvider = storedProvider;
    this.elements.sttProviderSelect.value = storedProvider;
    this.elements.ttsProviderSelect.value = storedTtsProvider;
    
    if (storedApiKey && storedApiKey.trim()) {
      this.state.hasApiKey = true;
      this.transcriptionService = new TranscriptionService(storedApiKey, storedProvider);
      this.conversationService = new ConversationService(storedApiKey, storedElevenlabsKey, storedFuturelinksKey);
      this.conversationService.setTtsProvider(storedTtsProvider);
      this.elements.apiKeyInput.value = storedApiKey;
      // Keep buttons disabled until API is tested
      this.elements.talkBtn.disabled = true;
      this.elements.conversationBtn.disabled = true;
    } else {
      // Initialize with empty API key
      this.transcriptionService = new TranscriptionService('', storedProvider);
      this.conversationService = new ConversationService('', storedElevenlabsKey, storedFuturelinksKey);
      this.conversationService.setTtsProvider(storedTtsProvider);
      this.elements.talkBtn.disabled = true;
      this.elements.conversationBtn.disabled = true;
      this.updateStatus('ready');
    }
    
    if (storedElevenlabsKey && storedElevenlabsKey.trim()) {
      this.elements.elevenlabsKeyInput.value = storedElevenlabsKey;
    }
    
    if (storedFuturelinksKey && storedFuturelinksKey.trim()) {
      this.elements.futurelinksKeyInput.value = storedFuturelinksKey;
    }
    
    // Show/hide TTS provider configs based on selection
    this.updateTtsProviderVisibility(storedTtsProvider);

    // Set up event listeners for all UI interactions
    this._setupEventListeners();
  }

  /**
   * Verify all required DOM elements exist
   * @private
   * @returns {boolean}
   */
  _verifyDOMElements() {
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.error(`Required DOM element not found: ${key}`);
        return false;
      } else {
        console.log(`✓ Found element: ${key}`);
      }
    }
    return true;
  }

  /**
   * Set up event listeners for all UI interactions
   * @private
   */
  _setupEventListeners() {
    // STT Provider selector
    this.elements.sttProviderSelect.addEventListener('change', (e) => {
      this.handleProviderChange(e.target.value);
    });

    // TTS Provider selector
    this.elements.ttsProviderSelect.addEventListener('change', (e) => {
      this.handleTtsProviderChange(e.target.value);
    });

    // API key save button
    this.elements.saveApiKeyBtn.addEventListener('click', () => {
      this.handleApiKeySubmit(this.elements.apiKeyInput.value);
    });

    // API key input - allow Enter key to submit
    this.elements.apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleApiKeySubmit(this.elements.apiKeyInput.value);
      }
    });

    // Test API key button
    this.elements.testApiKeyBtn.addEventListener('click', () => {
      this.handleTestApiKey();
    });

    // ElevenLabs API key save button
    this.elements.saveElevenlabsKeyBtn.addEventListener('click', () => {
      this.handleElevenlabsKeySubmit(this.elements.elevenlabsKeyInput.value);
    });

    // ElevenLabs key input - allow Enter key to submit
    this.elements.elevenlabsKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleElevenlabsKeySubmit(this.elements.elevenlabsKeyInput.value);
      }
    });

    // Test ElevenLabs API button
    this.elements.testElevenlabsBtn.addEventListener('click', () => {
      this.handleTestElevenlabs();
    });

    // TALK button - mousedown/mouseup events
    this.elements.talkBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleTalkButtonPress();
    });

    this.elements.talkBtn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.handleTalkButtonRelease();
    });

    // TALK button - touchstart/touchend events for mobile
    this.elements.talkBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTalkButtonPress();
    });

    this.elements.talkBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleTalkButtonRelease();
    });

    // Handle case where user moves mouse/touch outside button while holding
    this.elements.talkBtn.addEventListener('mouseleave', () => {
      if (this.state.isRecording) {
        this.handleTalkButtonRelease();
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.state.isRecording) {
        this.handleTalkButtonRelease();
      }
    });

    document.addEventListener('touchend', () => {
      if (this.state.isRecording) {
        this.handleTalkButtonRelease();
      }
    });

    // Conversation button toggle
    this.elements.conversationBtn.addEventListener('click', () => {
      console.log('Conversation button click event fired');
      this.handleConversationToggle();
    });

    // New conversation button
    this.elements.newConversationBtn.addEventListener('click', () => {
      console.log('New conversation button clicked');
      this.handleNewConversation();
    });

    // Voice selector
    this.elements.voiceSelect.addEventListener('change', (e) => {
      this.conversationService.setVoice(e.target.value);
    });

    // Response style selector
    this.elements.responseStyleSelect.addEventListener('change', (e) => {
      this.conversationService.setResponseStyle(e.target.value);
      console.log('Response style changed to:', e.target.value);
    });

    // ElevenLabs voice selector
    this.elements.elevenlabsVoiceSelect.addEventListener('change', (e) => {
      this.conversationService.setElevenlabsVoice(e.target.value);
      console.log('ElevenLabs voice changed to:', e.target.options[e.target.selectedIndex].text);
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

    // Populate voice selector
    this.populateVoiceSelector();
    
    console.log('Event listeners set up successfully');
  }

  /**
   * Populate voice selector with available voices
   */
  populateVoiceSelector() {
    const populateVoices = () => {
      const voices = this.conversationService.getAvailableVoices();
      
      if (voices.length === 0) {
        setTimeout(populateVoices, 100);
        return;
      }

      this.elements.voiceSelect.innerHTML = '';
      
      // Group voices by language
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const otherVoices = voices.filter(v => !v.lang.startsWith('en'));
      
      // Add English voices first
      if (englishVoices.length > 0) {
        const englishGroup = document.createElement('optgroup');
        englishGroup.label = 'English Voices';
        englishVoices.forEach(voice => {
          const option = document.createElement('option');
          option.value = voice.name;
          option.textContent = `${voice.name} (${voice.lang})`;
          englishGroup.appendChild(option);
        });
        this.elements.voiceSelect.appendChild(englishGroup);
      }
      
      // Add other voices
      if (otherVoices.length > 0) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = 'Other Languages';
        otherVoices.forEach(voice => {
          const option = document.createElement('option');
          option.value = voice.name;
          option.textContent = `${voice.name} (${voice.lang})`;
          otherGroup.appendChild(option);
        });
        this.elements.voiceSelect.appendChild(otherGroup);
      }
    };
    
    populateVoices();
  }

  /**
   * Handle TALK button press (mousedown/touchstart)
   */
  async handleTalkButtonPress() {
    // Prevent action if no API key or already recording
    if (!this.state.hasApiKey || this.state.isRecording) {
      return;
    }

    try {
      // Stop any ongoing speech (barge-in)
      if (this.conversationService.isSpeaking) {
        console.log('Stopping ongoing speech (barge-in)');
        this.conversationService.stopSpeaking();
      }
      
      this.state.isRecording = true;
      this.updateStatus('recording');
      this.elements.talkBtn.classList.add('recording');
      
      await this.audioRecorder.start();
    } catch (error) {
      this.state.isRecording = false;
      this.updateStatus('error');
      this.elements.talkBtn.classList.remove('recording');
      this.displayError(error.message);
    }
  }

  /**
   * Handle TALK button release (mouseup/touchend)
   */
  async handleTalkButtonRelease() {
    if (!this.state.isRecording) {
      console.log('Button released but not recording - ignoring');
      return;
    }

    try {
      console.log('TALK button released');
      this.state.isRecording = false;
      this.elements.talkBtn.classList.remove('recording');
      this.updateStatus('processing');

      // Stop recording and get audio blob
      const audioBlob = await this.audioRecorder.stop();
      console.log('Audio blob received:', audioBlob.size, 'bytes');

      // Send to transcription service
      const transcription = await this.transcriptionService.transcribe(audioBlob);
      console.log('Transcription received:', transcription);

      // Check if conversation mode is active
      console.log('Conversation mode active?', this.state.conversationMode);
      
      if (this.state.conversationMode) {
        console.log('Processing in conversation mode...');
        
        // Add user message to conversation
        this.addMessageToConversation('user', transcription);
        
        // Get AI response
        this.updateStatus('thinking');
        console.log('Sending to AI...');
        const aiResponse = await this.conversationService.sendMessage(transcription);
        console.log('AI response received:', aiResponse);
        
        // Add AI response to conversation
        this.addMessageToConversation('assistant', aiResponse);
        
        // Speak the response
        this.updateStatus('speaking');
        console.log('Speaking response...');
        await this.conversationService.speak(aiResponse);
        console.log('Finished speaking');
        
        this.updateStatus('ready');
      } else {
        console.log('Processing in normal transcription mode...');
        // Normal transcription mode
        this.displayTranscription(transcription);
        this.updateApiStats();
        this.updateStatus('ready');
      }
    } catch (error) {
      console.error('Error in handleTalkButtonRelease:', error);
      
      // Don't show error if it's just "no active recording" - user didn't hold button long enough
      if (error.message && error.message.includes('No active recording')) {
        console.log('User released button too quickly - no recording to process');
        this.state.isRecording = false;
        this.elements.talkBtn.classList.remove('recording');
        this.updateStatus('ready');
        return;
      }
      
      this.updateStatus('error');
      this.displayError(error.message);
    }
  }

  /**
   * Handle conversation mode toggle
   */
  handleConversationToggle() {
    console.log('Conversation button clicked!');
    console.log('Current conversation mode:', this.state.conversationMode);
    
    this.state.conversationMode = !this.state.conversationMode;
    
    console.log('New conversation mode:', this.state.conversationMode);
    
    if (this.state.conversationMode) {
      // Enable conversation mode
      console.log('Enabling conversation mode...');
      this.elements.conversationBtn.classList.add('active');
      this.elements.conversationSection.style.display = 'block';
      this.elements.resultSection.style.display = 'none';
      
      // Start new conversation with greeting
      this.startNewConversation();
      
      console.log('Conversation mode enabled');
    } else {
      // Disable conversation mode
      console.log('Disabling conversation mode...');
      this.elements.conversationBtn.classList.remove('active');
      this.elements.conversationSection.style.display = 'none';
      this.elements.resultSection.style.display = 'block';
      this.conversationService.stopSpeaking();
      this.updateStatus('ready');
      console.log('Conversation mode disabled');
    }
  }

  /**
   * Handle new conversation button click
   */
  async handleNewConversation() {
    if (!this.state.conversationMode) {
      return;
    }
    
    await this.startNewConversation();
  }

  /**
   * Start a new conversation with greeting
   */
  async startNewConversation() {
    try {
      // Clear history
      this.conversationService.clearHistory();
      this.elements.conversationHistory.innerHTML = '';
      
      // Generate and speak greeting
      this.updateStatus('thinking');
      const greeting = await this.conversationService.getGreeting();
      
      this.addMessageToConversation('assistant', greeting);
      
      this.updateStatus('speaking');
      await this.conversationService.speak(greeting);
      
      this.updateStatus('ready');
    } catch (error) {
      console.error('Error starting new conversation:', error);
      this.displayError('Failed to start conversation: ' + error.message);
      this.updateStatus('ready');
    }
  }

  /**
   * Add message to conversation history display
   * @param {string} role - 'user' or 'assistant'
   * @param {string} text - Message text
   */
  addMessageToConversation(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = role === 'user' ? 'You' : 'AI Assistant';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    messageDiv.appendChild(labelDiv);
    messageDiv.appendChild(textDiv);
    
    this.elements.conversationHistory.appendChild(messageDiv);
    
    // Scroll to bottom
    this.elements.conversationHistory.scrollTop = this.elements.conversationHistory.scrollHeight;
  }

  /**
   * Handle provider change
   * @param {string} provider - Selected provider
   */
  handleProviderChange(provider) {
    this.state.sttProvider = provider;
    this.state.apiKeyTested = false;
    localStorage.setItem('sttProvider', provider);
    
    // Update transcription service provider
    if (this.transcriptionService) {
      this.transcriptionService.setProvider(provider);
    }
    
    // Disable TALK button until API is tested again
    this.elements.talkBtn.disabled = true;
    this.elements.conversationBtn.disabled = true;
    
    // Update placeholder text
    const placeholders = {
      groq: 'Enter Groq API Key',
      openai: 'Enter OpenAI API Key',
      deepgram: 'Enter Deepgram API Key'
    };
    this.elements.apiKeyInput.placeholder = placeholders[provider] || 'Enter API Key';
    
    console.log('Provider changed to:', provider);
  }

  /**
   * Test API key with a dummy transcription
   */
  async handleTestApiKey() {
    const apiKey = this.elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.displayError('Please enter an API key first');
      return;
    }

    const originalText = this.elements.testApiKeyBtn.textContent;
    this.elements.testApiKeyBtn.textContent = 'Testing...';
    this.elements.testApiKeyBtn.disabled = true;
    
    // Hide any previous errors
    this.elements.errorDisplay.style.display = 'none';

    try {
      // Create a short silent audio blob for testing (100ms of silence)
      const sampleRate = 48000;
      const duration = 0.1; // 100ms
      const numSamples = sampleRate * duration;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      
      // Create a blob from the silent audio
      const wav = this._audioBufferToWav(buffer);
      const testBlob = new Blob([wav], { type: 'audio/wav' });
      
      // Test the API
      await this.transcriptionService.transcribe(testBlob);
      
      // Success!
      this.state.apiKeyTested = true;
      this.elements.talkBtn.disabled = false;
      this.elements.conversationBtn.disabled = false;
      this.elements.testApiKeyBtn.textContent = '✓ Success!';
      this.elements.errorDisplay.style.display = 'none';
      
      // Show success message briefly
      this.elements.statusDisplay.textContent = '✓ API key verified successfully!';
      this.elements.statusDisplay.style.background = '#e8f5e9';
      this.elements.statusDisplay.style.color = '#1b5e20';
      
      setTimeout(() => {
        this.elements.testApiKeyBtn.textContent = originalText;
        this.elements.testApiKeyBtn.disabled = false;
        this.updateStatus('ready');
      }, 3000);
    } catch (error) {
      this.state.apiKeyTested = false;
      this.elements.talkBtn.disabled = true;
      this.elements.conversationBtn.disabled = true;
      this.elements.testApiKeyBtn.textContent = '✗ Failed';
      
      // Show error on screen
      this.displayError('❌ API Test Failed: ' + error.message);
      
      setTimeout(() => {
        this.elements.testApiKeyBtn.textContent = originalText;
        this.elements.testApiKeyBtn.disabled = false;
      }, 3000);
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   * @private
   */
  _audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = buffer.getChannelData(0);
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  /**
   * Handle API key submission
   * @param {string} apiKey - The API key to save
   */
  handleApiKeySubmit(apiKey) {
    // Validate API key is not empty or whitespace-only
    if (!apiKey || !apiKey.trim()) {
      this.displayError('Please enter a valid API key.');
      return;
    }

    // Save to localStorage
    localStorage.setItem('sttApiKey', apiKey.trim());

    // Update state and service
    this.state.hasApiKey = true;
    this.state.apiKeyTested = false; // Reset tested flag
    this.transcriptionService.setApiKey(apiKey.trim());
    this.conversationService.setApiKey(apiKey.trim());

    // Keep buttons disabled until tested
    this.elements.talkBtn.disabled = true;
    this.elements.conversationBtn.disabled = true;

    // Hide error display and show success
    this.elements.errorDisplay.style.display = 'none';
    this.updateStatus('ready');

    // Provide feedback
    const originalText = this.elements.saveApiKeyBtn.textContent;
    this.elements.saveApiKeyBtn.textContent = 'Saved!';
    setTimeout(() => {
      this.elements.saveApiKeyBtn.textContent = originalText;
    }, 2000);
  }

  /**
   * Handle ElevenLabs API key submission
   * @param {string} apiKey - The ElevenLabs API key to save
   */
  handleElevenlabsKeySubmit(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      // Clear ElevenLabs key
      localStorage.removeItem('elevenlabsApiKey');
      this.conversationService.setElevenlabsKey(null);
      
      const originalText = this.elements.saveElevenlabsKeyBtn.textContent;
      this.elements.saveElevenlabsKeyBtn.textContent = 'Cleared!';
      setTimeout(() => {
        this.elements.saveElevenlabsKeyBtn.textContent = originalText;
      }, 2000);
      return;
    }

    // Save to localStorage
    localStorage.setItem('elevenlabsApiKey', apiKey.trim());

    // Update service
    this.conversationService.setElevenlabsKey(apiKey.trim());

    // Provide feedback
    const originalText = this.elements.saveElevenlabsKeyBtn.textContent;
    this.elements.saveElevenlabsKeyBtn.textContent = 'Saved!';
    setTimeout(() => {
      this.elements.saveElevenlabsKeyBtn.textContent = originalText;
    }, 2000);
  }

  /**
   * Test ElevenLabs API connection
   */
  async handleTestElevenlabs() {
    const apiKey = this.elements.elevenlabsKeyInput.value.trim();
    
    if (!apiKey) {
      this.displayError('Please enter an ElevenLabs API key first');
      return;
    }

    const originalText = this.elements.testElevenlabsBtn.textContent;
    this.elements.testElevenlabsBtn.textContent = 'Testing...';
    this.elements.testElevenlabsBtn.disabled = true;
    
    // Hide any previous errors
    this.elements.errorDisplay.style.display = 'none';

    try {
      // Test with a short message using the existing conversation service
      // First, save the key to ensure it's set
      this.conversationService.setElevenlabsKey(apiKey);
      
      // Force ElevenLabs usage for this test
      const originalUseElevenLabs = this.conversationService.useElevenLabs;
      this.conversationService.useElevenLabs = true;
      
      await this.conversationService.speak('Testing ElevenLabs API connection');
      
      // Restore original setting
      this.conversationService.useElevenLabs = originalUseElevenLabs;
      
      // Enable voice selector on success
      this.elements.elevenlabsVoiceSelect.disabled = false;
      
      this.elements.testElevenlabsBtn.textContent = '✓ Success!';
      this.elements.errorDisplay.style.display = 'none';
      
      // Show success message briefly
      this.elements.statusDisplay.textContent = '✓ ElevenLabs API verified successfully!';
      this.elements.statusDisplay.style.background = '#e8f5e9';
      this.elements.statusDisplay.style.color = '#1b5e20';
      
      setTimeout(() => {
        this.elements.testElevenlabsBtn.textContent = originalText;
        this.elements.testElevenlabsBtn.disabled = false;
        this.updateStatus('ready');
      }, 3000);
    } catch (error) {
      // Disable voice selector on failure
      this.elements.elevenlabsVoiceSelect.disabled = true;
      
      this.elements.testElevenlabsBtn.textContent = '✗ Failed';
      
      // Show error on screen
      this.displayError('❌ ElevenLabs Test Failed: ' + error.message);
      
      setTimeout(() => {
        this.elements.testElevenlabsBtn.textContent = originalText;
        this.elements.testElevenlabsBtn.disabled = false;
      }, 3000);
    }
  }

  /**
   * Update UI state
   * @param {string} status - 'ready' | 'recording' | 'processing' | 'error'
   */
  updateStatus(status) {
    this.state.status = status;

    const statusMessages = {
      ready: this.state.hasApiKey 
        ? (this.state.conversationMode ? 'Status: Ready - Conversation Mode Active' : 'Status: Ready')
        : 'Status: Please configure your Groq API key to start recording',
      recording: 'Status: Recording... (hold button)',
      processing: 'Status: Processing transcription...',
      thinking: 'Status: AI is thinking...',
      speaking: 'Status: AI is speaking...',
      error: 'Status: Error occurred'
    };

    this.elements.statusDisplay.textContent = statusMessages[status] || 'Status: Unknown';

    // Update button state based on status
    if (status === 'processing') {
      this.elements.talkBtn.disabled = true;
    } else if (status === 'ready' && this.state.hasApiKey) {
      this.elements.talkBtn.disabled = false;
    }
  }

  /**
   * Display transcription result
   * @param {string} text - The transcribed text
   */
  displayTranscription(text) {
    this.elements.transcriptionOutput.value = text;
    this.elements.errorDisplay.style.display = 'none';
  }

  /**
   * Display error message
   * @param {string} message - The error message to display
   */
  displayError(message) {
    this.elements.errorDisplay.textContent = message;
    this.elements.errorDisplay.style.display = 'block';
  }

  /**
   * Update API usage statistics display
   */
  updateApiStats() {
    const stats = this.transcriptionService.getLastApiStats();
    
    if (!stats || !this.elements.statsDisplay) {
      return;
    }

    const audioSizeKB = Math.round(stats.audioDuration);
    let statsHTML = '<div class="stats-title">📊 Last Transcription:</div>';

    // Always show audio size
    statsHTML += `
      <div class="stat-item">
        <span class="stat-label">Audio Size:</span>
        <span class="stat-value">${audioSizeKB} KB</span>
      </div>
    `;

    // Show audio duration if available
    if (stats.audioDurationSeconds) {
      statsHTML += `
        <div class="stat-item">
          <span class="stat-label">Duration:</span>
          <span class="stat-value">${stats.audioDurationSeconds.toFixed(1)} seconds</span>
        </div>
      `;
    }

    // Show timestamp
    const time = new Date(stats.timestamp).toLocaleTimeString();
    statsHTML += `
      <div class="stat-item">
        <span class="stat-label">Time:</span>
        <span class="stat-value">${time}</span>
      </div>
    `;

    // Show rate limit info if available (usually blocked by CORS in browser)
    if (stats.requestsLimit !== null && stats.requestsRemaining !== null) {
      statsHTML += `
        <div class="stat-item">
          <span class="stat-label">Requests Today:</span>
          <span class="stat-value">${stats.requestsRemaining} remaining (of ${stats.requestsLimit})</span>
        </div>
      `;
    }

    if (stats.tokensLimit !== null && stats.tokensRemaining !== null) {
      statsHTML += `
        <div class="stat-item">
          <span class="stat-label">Tokens/Min:</span>
          <span class="stat-value">${stats.tokensRemaining} remaining (of ${stats.tokensLimit})</span>
        </div>
      `;
    }

    // Add link to check usage on Groq dashboard
    statsHTML += `
      <div class="stat-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #c8e6c9;">
        <span class="stat-label">Check Usage:</span>
        <span class="stat-value"><a href="https://console.groq.com/settings/limits" target="_blank" style="color: #1b5e20; text-decoration: underline;">Groq Dashboard →</a></span>
      </div>
    `;

    this.elements.statsDisplay.innerHTML = statsHTML;
    this.elements.statsDisplay.style.display = 'block';
  }

  /**
   * Handle TTS provider change
   * @param {string} provider - Selected TTS provider ('browser', 'elevenlabs', 'futurelinks')
   */
  handleTtsProviderChange(provider) {
    this.conversationService.setTtsProvider(provider);
    localStorage.setItem('ttsProvider', provider);
    
    // Update visibility of provider-specific configs
    this.updateTtsProviderVisibility(provider);
    
    console.log('TTS provider changed to:', provider);
  }

  /**
   * Update visibility of TTS provider config sections
   * @param {string} provider - Selected TTS provider
   */
  updateTtsProviderVisibility(provider) {
    const elevenlabsConfig = document.getElementById('elevenlabs-config');
    const futurelinksConfig = document.getElementById('futurelinks-config');
    
    if (elevenlabsConfig) {
      elevenlabsConfig.style.display = provider === 'elevenlabs' ? 'block' : 'none';
    }
    
    if (futurelinksConfig) {
      futurelinksConfig.style.display = provider === 'futurelinks' ? 'block' : 'none';
    }
  }

  /**
   * Handle FutureLinks.ai API key submission
   * @param {string} apiKey - The FutureLinks.ai API key to save
   */
  handleFuturelinksKeySubmit(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      // Clear FutureLinks key
      localStorage.removeItem('futurelinksApiKey');
      this.conversationService.setFuturelinksKey(null);
      
      const originalText = this.elements.saveFuturelinksKeyBtn.textContent;
      this.elements.saveFuturelinksKeyBtn.textContent = 'Cleared!';
      setTimeout(() => {
        this.elements.saveFuturelinksKeyBtn.textContent = originalText;
      }, 2000);
      return;
    }

    // Save to localStorage
    localStorage.setItem('futurelinksApiKey', apiKey.trim());

    // Update service
    this.conversationService.setFuturelinksKey(apiKey.trim());

    // Provide feedback
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
    
    // Hide any previous errors
    this.elements.errorDisplay.style.display = 'none';

    try {
      // Test with a short message
      this.conversationService.setFuturelinksKey(apiKey);
      
      // Temporarily switch to FutureLinks for test
      const originalProvider = this.conversationService.ttsProvider;
      this.conversationService.ttsProvider = 'futurelinks';
      
      await this.conversationService.speak('Testing FutureLinks AI connection');
      
      // Restore original provider
      this.conversationService.ttsProvider = originalProvider;
      
      // Enable voice selector on success
      this.elements.futurelinksVoiceSelect.disabled = false;
      
      this.elements.testFuturelinksBtn.textContent = '✓ Success!';
      this.elements.errorDisplay.style.display = 'none';
      
      // Show success message briefly
      this.elements.statusDisplay.textContent = '✓ FutureLinks.ai API verified successfully!';
      this.elements.statusDisplay.style.background = '#e8f5e9';
      this.elements.statusDisplay.style.color = '#1b5e20';
      
      setTimeout(() => {
        this.elements.testFuturelinksBtn.textContent = originalText;
        this.elements.testFuturelinksBtn.disabled = false;
        this.updateStatus('ready');
      }, 3000);
    } catch (error) {
      // Disable voice selector on failure
      this.elements.futurelinksVoiceSelect.disabled = true;
      
      this.elements.testFuturelinksBtn.textContent = '✗ Failed';
      
      // Show error on screen
      this.displayError('❌ FutureLinks.ai Test Failed: ' + error.message);
      
      setTimeout(() => {
        this.elements.testFuturelinksBtn.textContent = originalText;
        this.elements.testFuturelinksBtn.disabled = false;
      }, 3000);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
