/**
 * Unit tests for UIController component
 * Tests initialization and basic functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock AudioRecorder
global.AudioRecorder = class AudioRecorder {
  constructor() {
    this.state = 'inactive';
  }
  async start() {
    this.state = 'recording';
  }
  async stop() {
    this.state = 'inactive';
    return new Blob(['test'], { type: 'audio/webm' });
  }
  getState() {
    return this.state;
  }
  static isSupported() {
    return true;
  }
};

// Mock TranscriptionService
global.TranscriptionService = class TranscriptionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async transcribe(audioBlob) {
    return 'Test transcription';
  }
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
};

// Load UIController
const UIController = (await import('../../js/components/UIController.js')).default || 
                     (await import('../../js/components/UIController.js'));

describe('UIController', () => {
  let dom;
  let document;
  let controller;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app">
            <div id="api-key-section">
              <input id="api-key-input" type="password" placeholder="Enter Groq API Key">
              <button id="save-api-key-btn">Save API Key</button>
            </div>
            <div id="status-display">Status: Ready</div>
            <div id="controls">
              <button id="talk-btn" class="talk-button" disabled>TALK</button>
            </div>
            <div id="result-section">
              <textarea id="transcription-output" readonly></textarea>
            </div>
            <div id="error-display" style="display: none;"></div>
          </div>
        </body>
      </html>
    `);

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };

    controller = new UIController();
  });

  describe('Initialization', () => {
    it('should get references to all DOM elements', () => {
      controller.init();

      expect(controller.elements.apiKeyInput).toBeTruthy();
      expect(controller.elements.saveApiKeyBtn).toBeTruthy();
      expect(controller.elements.statusDisplay).toBeTruthy();
      expect(controller.elements.talkBtn).toBeTruthy();
      expect(controller.elements.transcriptionOutput).toBeTruthy();
      expect(controller.elements.errorDisplay).toBeTruthy();
    });

    it('should initialize AudioRecorder instance', () => {
      controller.init();

      expect(controller.audioRecorder).toBeTruthy();
      expect(controller.audioRecorder).toBeInstanceOf(AudioRecorder);
    });

    it('should initialize TranscriptionService instance', () => {
      controller.init();

      expect(controller.transcriptionService).toBeTruthy();
      expect(controller.transcriptionService).toBeInstanceOf(TranscriptionService);
    });

    it('should load API key from localStorage on startup', () => {
      localStorage.setItem('groqApiKey', 'test-api-key');
      
      controller.init();

      expect(controller.state.hasApiKey).toBe(true);
      expect(controller.elements.apiKeyInput.value).toBe('test-api-key');
      expect(controller.elements.talkBtn.disabled).toBe(false);
    });

    it('should disable TALK button when no API key is configured', () => {
      localStorage.clear();
      
      controller.init();

      expect(controller.state.hasApiKey).toBe(false);
      expect(controller.elements.talkBtn.disabled).toBe(true);
    });

    it('should set up event listeners for all UI interactions', () => {
      const addEventListenerSpy = vi.spyOn(document.getElementById('save-api-key-btn'), 'addEventListener');
      
      controller.init();

      expect(addEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('API Key Management', () => {
    beforeEach(() => {
      controller.init();
    });

    it('should validate and save non-empty API key', () => {
      controller.handleApiKeySubmit('valid-api-key');

      expect(localStorage.getItem('groqApiKey')).toBe('valid-api-key');
      expect(controller.state.hasApiKey).toBe(true);
      expect(controller.elements.talkBtn.disabled).toBe(false);
    });

    it('should reject empty API key', () => {
      controller.handleApiKeySubmit('');

      expect(localStorage.getItem('groqApiKey')).toBeNull();
      expect(controller.elements.errorDisplay.style.display).toBe('block');
    });

    it('should reject whitespace-only API key', () => {
      controller.handleApiKeySubmit('   ');

      expect(localStorage.getItem('groqApiKey')).toBeNull();
      expect(controller.elements.errorDisplay.style.display).toBe('block');
    });

    it('should trim API key before saving', () => {
      controller.handleApiKeySubmit('  api-key-with-spaces  ');

      expect(localStorage.getItem('groqApiKey')).toBe('api-key-with-spaces');
    });
  });

  describe('Status Updates', () => {
    beforeEach(() => {
      controller.init();
      localStorage.setItem('groqApiKey', 'test-key');
      controller.state.hasApiKey = true;
    });

    it('should update status display for ready state', () => {
      controller.updateStatus('ready');

      expect(controller.elements.statusDisplay.textContent).toContain('Ready');
      expect(controller.state.status).toBe('ready');
    });

    it('should update status display for recording state', () => {
      controller.updateStatus('recording');

      expect(controller.elements.statusDisplay.textContent).toContain('Recording');
      expect(controller.state.status).toBe('recording');
    });

    it('should update status display for processing state', () => {
      controller.updateStatus('processing');

      expect(controller.elements.statusDisplay.textContent).toContain('Processing');
      expect(controller.state.status).toBe('processing');
      expect(controller.elements.talkBtn.disabled).toBe(true);
    });

    it('should update status display for error state', () => {
      controller.updateStatus('error');

      expect(controller.elements.statusDisplay.textContent).toContain('Error');
      expect(controller.state.status).toBe('error');
    });
  });

  describe('Display Methods', () => {
    beforeEach(() => {
      controller.init();
    });

    it('should display transcription text', () => {
      const testText = 'This is a test transcription';
      
      controller.displayTranscription(testText);

      expect(controller.elements.transcriptionOutput.value).toBe(testText);
      expect(controller.elements.errorDisplay.style.display).toBe('none');
    });

    it('should display error message', () => {
      const errorMessage = 'Test error message';
      
      controller.displayError(errorMessage);

      expect(controller.elements.errorDisplay.textContent).toBe(errorMessage);
      expect(controller.elements.errorDisplay.style.display).toBe('block');
    });
  });

  describe('Recording Control Handlers', () => {
    beforeEach(() => {
      controller.init();
      localStorage.setItem('groqApiKey', 'test-key');
      controller.state.hasApiKey = true;
      controller.elements.talkBtn.disabled = false;
    });

    it('should start recording on button press', async () => {
      await controller.handleTalkButtonPress();

      expect(controller.state.isRecording).toBe(true);
      expect(controller.state.status).toBe('recording');
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);
      expect(controller.audioRecorder.getState()).toBe('recording');
    });

    it('should not start recording if no API key', async () => {
      controller.state.hasApiKey = false;

      await controller.handleTalkButtonPress();

      expect(controller.state.isRecording).toBe(false);
      expect(controller.audioRecorder.getState()).toBe('inactive');
    });

    it('should not start recording if already recording', async () => {
      controller.state.isRecording = true;
      const startSpy = vi.spyOn(controller.audioRecorder, 'start');

      await controller.handleTalkButtonPress();

      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should stop recording and transcribe on button release', async () => {
      // Start recording first
      await controller.handleTalkButtonPress();
      expect(controller.state.isRecording).toBe(true);

      // Release button
      await controller.handleTalkButtonRelease();

      expect(controller.state.isRecording).toBe(false);
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
      expect(controller.elements.transcriptionOutput.value).toBe('Test transcription');
      expect(controller.state.status).toBe('ready');
    });

    it('should not process if not recording on button release', async () => {
      controller.state.isRecording = false;
      const stopSpy = vi.spyOn(controller.audioRecorder, 'stop');

      await controller.handleTalkButtonRelease();

      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should update UI state to processing during transcription', async () => {
      // Start recording
      await controller.handleTalkButtonPress();
      
      // Mock a delay in transcription
      controller.transcriptionService.transcribe = vi.fn(async () => {
        // Check status during processing
        expect(controller.state.status).toBe('processing');
        return 'Delayed transcription';
      });

      // Release button
      await controller.handleTalkButtonRelease();

      expect(controller.elements.transcriptionOutput.value).toBe('Delayed transcription');
    });

    it('should handle recording errors gracefully', async () => {
      controller.audioRecorder.start = vi.fn(async () => {
        throw new Error('Microphone access denied');
      });

      await controller.handleTalkButtonPress();

      expect(controller.state.isRecording).toBe(false);
      expect(controller.state.status).toBe('error');
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
      expect(controller.elements.errorDisplay.textContent).toContain('Microphone access denied');
    });

    it('should handle transcription errors gracefully', async () => {
      // Start recording
      await controller.handleTalkButtonPress();

      // Mock transcription error
      controller.transcriptionService.transcribe = vi.fn(async () => {
        throw new Error('API request failed');
      });

      // Release button
      await controller.handleTalkButtonRelease();

      expect(controller.state.status).toBe('error');
      expect(controller.elements.errorDisplay.textContent).toContain('API request failed');
    });
  });
});
