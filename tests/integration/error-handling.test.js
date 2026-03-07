/**
 * Integration tests for error handling across all components
 * Validates Requirements 1.5 and 2.3
 * 
 * This test suite verifies that errors from AudioRecorder and TranscriptionService
 * are properly caught by UIController and displayed to the user with appropriate
 * error messages and status updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock AudioRecorder with error scenarios
class MockAudioRecorder {
  constructor() {
    this.state = 'inactive';
    this.shouldFailStart = false;
    this.shouldFailStop = false;
    this.startError = null;
    this.stopError = null;
  }

  async start() {
    if (this.shouldFailStart) {
      throw this.startError || new Error('Recording failed');
    }
    this.state = 'recording';
  }

  async stop() {
    if (this.shouldFailStop) {
      throw this.stopError || new Error('Stop failed');
    }
    this.state = 'inactive';
    return new Blob(['test'], { type: 'audio/webm' });
  }

  getState() {
    return this.state;
  }

  static isSupported() {
    return true;
  }
}

// Mock TranscriptionService with error scenarios
class MockTranscriptionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.shouldFail = false;
    this.error = null;
  }

  async transcribe(audioBlob) {
    if (this.shouldFail) {
      throw this.error || new Error('Transcription failed');
    }
    return 'Test transcription';
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
}

// Set up global mocks
global.AudioRecorder = MockAudioRecorder;
global.TranscriptionService = MockTranscriptionService;

// Load UIController
const UIController = (await import('../../js/components/UIController.js')).default || 
                     (await import('../../js/components/UIController.js'));

describe('Error Handling Integration', () => {
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
    controller.init();
    localStorage.setItem('groqApiKey', 'test-key');
    controller.state.hasApiKey = true;
    controller.elements.talkBtn.disabled = false;
  });

  describe('AudioRecorder Error Handling', () => {
    it('should catch and display microphone permission denied error', async () => {
      // Configure AudioRecorder to fail with permission error
      controller.audioRecorder.shouldFailStart = true;
      controller.audioRecorder.startError = new Error(
        'Microphone access denied. Please allow microphone permission to use this app.'
      );

      await controller.handleTalkButtonPress();

      // Verify error is displayed
      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('Microphone access denied');
      
      // Verify status is set to error
      expect(controller.state.status).toBe('error');
      
      // Verify recording state is reset
      expect(controller.state.isRecording).toBe(false);
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
    });

    it('should catch and display microphone not found error', async () => {
      controller.audioRecorder.shouldFailStart = true;
      controller.audioRecorder.startError = new Error(
        'No microphone found. Please connect a microphone and try again.'
      );

      await controller.handleTalkButtonPress();

      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('No microphone found');
      expect(controller.state.status).toBe('error');
      expect(controller.state.isRecording).toBe(false);
    });

    it('should catch and display generic recording errors', async () => {
      controller.audioRecorder.shouldFailStart = true;
      controller.audioRecorder.startError = new Error('Failed to start recording: Unknown error');

      await controller.handleTalkButtonPress();

      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('Failed to start recording');
      expect(controller.state.status).toBe('error');
    });
  });

  describe('TranscriptionService Error Handling', () => {
    beforeEach(async () => {
      // Start recording first
      await controller.handleTalkButtonPress();
      expect(controller.state.isRecording).toBe(true);
    });

    it('should catch and display invalid API key error', async () => {
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error(
        'Invalid API key. Please check your Groq API key and try again.'
      );

      await controller.handleTalkButtonRelease();

      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('Invalid API key');
      expect(controller.state.status).toBe('error');
    });

    it('should catch and display rate limit error', async () => {
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error(
        'Rate limit exceeded. Please wait a moment and try again.'
      );

      await controller.handleTalkButtonRelease();

      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('Rate limit exceeded');
      expect(controller.state.status).toBe('error');
    });

    it('should catch and display server error', async () => {
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error(
        'Service temporarily unavailable. Please try again later.'
      );

      await controller.handleTalkButtonRelease();

      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('Service temporarily unavailable');
      expect(controller.state.status).toBe('error');
    });

    it('should catch and display network error', async () => {
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error(
        'Network error. Please check your connection and try again.'
      );

      await controller.handleTalkButtonRelease();

      expect(controller.elements.errorDisplay.style.display).toBe('block');
      expect(controller.elements.errorDisplay.textContent).toContain('Network error');
      expect(controller.state.status).toBe('error');
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after recording error', async () => {
      // First attempt fails
      controller.audioRecorder.shouldFailStart = true;
      controller.audioRecorder.startError = new Error('Microphone access denied');

      await controller.handleTalkButtonPress();
      expect(controller.state.status).toBe('error');

      // Second attempt succeeds
      controller.audioRecorder.shouldFailStart = false;
      await controller.handleTalkButtonPress();
      expect(controller.state.status).toBe('recording');
      expect(controller.state.isRecording).toBe(true);
    });

    it('should allow retry after transcription error', async () => {
      // First attempt - recording succeeds, transcription fails
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error('Network error');

      await controller.handleTalkButtonPress();
      await controller.handleTalkButtonRelease();
      expect(controller.state.status).toBe('error');

      // Second attempt - both succeed
      controller.transcriptionService.shouldFail = false;
      await controller.handleTalkButtonPress();
      await controller.handleTalkButtonRelease();
      
      expect(controller.state.status).toBe('ready');
      expect(controller.elements.transcriptionOutput.value).toBe('Test transcription');
    });

    it('should clear error display on successful transcription', async () => {
      // First attempt fails
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error('API error');

      await controller.handleTalkButtonPress();
      await controller.handleTalkButtonRelease();
      expect(controller.elements.errorDisplay.style.display).toBe('block');

      // Second attempt succeeds
      controller.transcriptionService.shouldFail = false;
      await controller.handleTalkButtonPress();
      await controller.handleTalkButtonRelease();

      // Error display should be hidden
      expect(controller.elements.errorDisplay.style.display).toBe('none');
      expect(controller.elements.transcriptionOutput.value).toBe('Test transcription');
    });
  });

  describe('State Consistency After Errors', () => {
    it('should maintain consistent state after recording error', async () => {
      controller.audioRecorder.shouldFailStart = true;
      controller.audioRecorder.startError = new Error('Recording failed');

      await controller.handleTalkButtonPress();

      // Verify state is consistent
      expect(controller.state.isRecording).toBe(false);
      expect(controller.state.status).toBe('error');
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
      expect(controller.audioRecorder.getState()).toBe('inactive');
    });

    it('should maintain consistent state after transcription error', async () => {
      controller.transcriptionService.shouldFail = true;
      controller.transcriptionService.error = new Error('Transcription failed');

      await controller.handleTalkButtonPress();
      await controller.handleTalkButtonRelease();

      // Verify state is consistent
      expect(controller.state.isRecording).toBe(false);
      expect(controller.state.status).toBe('error');
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
    });
  });
});
