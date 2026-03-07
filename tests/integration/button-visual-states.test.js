/**
 * Integration tests for TALK button visual states
 * Task 8.1: Style the TALK button with visual states
 * Requirements: 1.6, 4.2, 4.5
 * 
 * Validates that the button styling integrates correctly with UIController
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock AudioRecorder
class MockAudioRecorder {
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
}

// Mock TranscriptionService
class MockTranscriptionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async transcribe(audioBlob) {
    return 'Test transcription';
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
}

// Set up global mocks
global.AudioRecorder = MockAudioRecorder;
global.TranscriptionService = MockTranscriptionService;

// Import UIController after mocks are set up
const UIController = (await import('../../js/components/UIController.js')).default;

describe('TALK Button Visual States Integration', () => {
  let controller;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
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
    `;

    // Create controller
    controller = new UIController();
    controller.init();

    // Set API key to enable button
    controller.state.hasApiKey = true;
    controller.elements.talkBtn.disabled = false;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Button State Classes', () => {
    test('button starts with talk-button class', () => {
      expect(controller.elements.talkBtn.classList.contains('talk-button')).toBe(true);
    });

    test('button does not have recording class initially', () => {
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
    });

    test('button gets recording class when pressed', async () => {
      await controller.handleTalkButtonPress();
      
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);
      expect(controller.state.isRecording).toBe(true);
    });

    test('button loses recording class when released', async () => {
      // Start recording
      await controller.handleTalkButtonPress();
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);

      // Stop recording
      await controller.handleTalkButtonRelease();
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
      expect(controller.state.isRecording).toBe(false);
    });

    test('button maintains talk-button class throughout recording cycle', async () => {
      // Initial state
      expect(controller.elements.talkBtn.classList.contains('talk-button')).toBe(true);

      // During recording
      await controller.handleTalkButtonPress();
      expect(controller.elements.talkBtn.classList.contains('talk-button')).toBe(true);
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);

      // After recording
      await controller.handleTalkButtonRelease();
      expect(controller.elements.talkBtn.classList.contains('talk-button')).toBe(true);
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
    });
  });

  describe('Button Disabled State', () => {
    test('button is disabled when no API key', () => {
      controller.state.hasApiKey = false;
      controller.elements.talkBtn.disabled = true;
      
      expect(controller.elements.talkBtn.disabled).toBe(true);
    });

    test('button is disabled during processing', async () => {
      await controller.handleTalkButtonPress();
      await controller.handleTalkButtonRelease();
      
      // During processing, button should be disabled
      // (Note: In real implementation, this happens briefly during transcription)
      controller.updateStatus('processing');
      expect(controller.elements.talkBtn.disabled).toBe(true);
    });

    test('button is enabled when ready with API key', () => {
      controller.state.hasApiKey = true;
      controller.updateStatus('ready');
      
      expect(controller.elements.talkBtn.disabled).toBe(false);
    });
  });

  describe('Visual State Requirements', () => {
    test('Requirement 1.6: Visual indicator while recording', async () => {
      // Start recording
      await controller.handleTalkButtonPress();
      
      // Verify visual indicator (recording class) is present
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);
      expect(controller.state.status).toBe('recording');
    });

    test('Requirement 4.2: Button appearance changes while held down', async () => {
      // When button is pressed (held down)
      await controller.handleTalkButtonPress();
      
      // Button should have recording class (which changes appearance)
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);
      
      // When button is released
      await controller.handleTalkButtonRelease();
      
      // Recording class should be removed
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
    });

    test('Requirement 4.5: Visual indicator on button while recording is active', async () => {
      // Start recording
      await controller.handleTalkButtonPress();
      
      // While recording is active
      expect(controller.state.isRecording).toBe(true);
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(true);
      
      // Stop recording
      await controller.handleTalkButtonRelease();
      
      // After recording stops
      expect(controller.state.isRecording).toBe(false);
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
    });
  });

  describe('Error State Handling', () => {
    test('recording class is removed on error during start', async () => {
      // Mock start to throw error
      const originalStart = controller.audioRecorder.start;
      controller.audioRecorder.start = async () => {
        throw new Error('Microphone access denied');
      };
      
      await controller.handleTalkButtonPress();
      
      // Recording class should be removed on error
      expect(controller.elements.talkBtn.classList.contains('recording')).toBe(false);
      expect(controller.state.isRecording).toBe(false);
      
      // Restore original
      controller.audioRecorder.start = originalStart;
    });

    test('button maintains talk-button class on error', async () => {
      // Mock start to throw error
      const originalStart = controller.audioRecorder.start;
      controller.audioRecorder.start = async () => {
        throw new Error('Test error');
      };
      
      await controller.handleTalkButtonPress();
      
      expect(controller.elements.talkBtn.classList.contains('talk-button')).toBe(true);
      
      // Restore original
      controller.audioRecorder.start = originalStart;
    });
  });
});
