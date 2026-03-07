/**
 * Unit tests for AudioRecorder component
 * Tests microphone permission error handling and MediaRecorder support
 * 
 * Requirements: 1.5 - Microphone permission error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.mimeType = options?.mimeType || 'audio/webm';
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.onerror = null;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }

  static isTypeSupported(type) {
    return type.includes('audio/webm') || type.includes('audio/ogg');
  }
}

describe('AudioRecorder - Error Handling', () => {
  let AudioRecorder;
  let mockGetUserMedia;
  let originalMediaRecorder;
  let originalGetUserMedia;

  beforeEach(async () => {
    // Save original implementations
    originalMediaRecorder = global.MediaRecorder;
    originalGetUserMedia = global.navigator?.mediaDevices?.getUserMedia;

    // Set up MediaRecorder mock
    global.MediaRecorder = MockMediaRecorder;

    // Set up getUserMedia mock
    mockGetUserMedia = vi.fn();
    global.navigator = {
      mediaDevices: {
        getUserMedia: mockGetUserMedia
      }
    };

    // Import AudioRecorder after mocks are set up
    const module = await import('../../js/components/AudioRecorder.js');
    AudioRecorder = module.default || module;
  });

  afterEach(() => {
    // Restore original implementations
    if (originalMediaRecorder) {
      global.MediaRecorder = originalMediaRecorder;
    }
    if (originalGetUserMedia) {
      global.navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    }
    vi.clearAllMocks();
  });

  describe('getUserMedia() Error Handling', () => {
    it('should catch and handle permission denied error (NotAllowedError)', async () => {
      const recorder = new AudioRecorder();
      
      // Mock permission denied
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      await expect(recorder.start()).rejects.toThrow(
        'Microphone access denied. Please allow microphone permission to use this app.'
      );
    });

    it('should catch and handle permission denied error (PermissionDeniedError)', async () => {
      const recorder = new AudioRecorder();
      
      // Mock permission denied with alternative error name
      const permissionError = new Error('Permission denied');
      permissionError.name = 'PermissionDeniedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      await expect(recorder.start()).rejects.toThrow(
        'Microphone access denied. Please allow microphone permission to use this app.'
      );
    });

    it('should catch and handle microphone not found error', async () => {
      const recorder = new AudioRecorder();
      
      // Mock no microphone found
      const notFoundError = new Error('No microphone found');
      notFoundError.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(notFoundError);

      await expect(recorder.start()).rejects.toThrow(
        'No microphone found. Please connect a microphone and try again.'
      );
    });

    it('should catch and handle generic getUserMedia errors', async () => {
      const recorder = new AudioRecorder();
      
      // Mock generic error
      const genericError = new Error('Unknown error');
      genericError.name = 'UnknownError';
      mockGetUserMedia.mockRejectedValue(genericError);

      await expect(recorder.start()).rejects.toThrow(
        'Failed to start recording: Unknown error'
      );
    });

    it('should clean up stream on error', async () => {
      const recorder = new AudioRecorder();
      
      // Create mock stream with tracks
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };

      // Mock getUserMedia to succeed first, then fail during MediaRecorder creation
      mockGetUserMedia.mockResolvedValue(mockStream);
      
      // Make MediaRecorder constructor throw
      const originalMediaRecorder = global.MediaRecorder;
      global.MediaRecorder = vi.fn(() => {
        throw new Error('MediaRecorder creation failed');
      });

      try {
        await recorder.start();
      } catch (error) {
        // Error expected
      }

      // Verify stream was cleaned up
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(recorder.stream).toBeNull();

      // Restore MediaRecorder
      global.MediaRecorder = originalMediaRecorder;
    });
  });

  describe('MediaRecorder Support Detection', () => {
    it('should detect when MediaRecorder is supported', () => {
      // MediaRecorder is mocked and available
      expect(AudioRecorder.isSupported()).toBe(true);
    });

    it('should detect when MediaRecorder is not supported', () => {
      // Remove MediaRecorder
      const originalMediaRecorder = global.MediaRecorder;
      delete global.MediaRecorder;

      expect(AudioRecorder.isSupported()).toBe(false);

      // Restore
      global.MediaRecorder = originalMediaRecorder;
    });

    it('should detect when getUserMedia is not supported', () => {
      // Remove getUserMedia
      const originalGetUserMedia = global.navigator.mediaDevices.getUserMedia;
      delete global.navigator.mediaDevices.getUserMedia;

      expect(AudioRecorder.isSupported()).toBe(false);

      // Restore
      global.navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    });

    it('should detect when mediaDevices is not supported', () => {
      // Remove mediaDevices
      const originalMediaDevices = global.navigator.mediaDevices;
      delete global.navigator.mediaDevices;

      expect(AudioRecorder.isSupported()).toBe(false);

      // Restore
      global.navigator.mediaDevices = originalMediaDevices;
    });
  });

  describe('Error Messages', () => {
    it('should display appropriate error message for permission denied', async () => {
      const recorder = new AudioRecorder();
      
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      try {
        await recorder.start();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe(
          'Microphone access denied. Please allow microphone permission to use this app.'
        );
      }
    });

    it('should display appropriate error message for no microphone', async () => {
      const recorder = new AudioRecorder();
      
      const notFoundError = new Error('No microphone');
      notFoundError.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(notFoundError);

      try {
        await recorder.start();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe(
          'No microphone found. Please connect a microphone and try again.'
        );
      }
    });
  });

  describe('Recording State After Errors', () => {
    it('should remain in inactive state after permission error', async () => {
      const recorder = new AudioRecorder();
      
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      try {
        await recorder.start();
      } catch (error) {
        // Error expected
      }

      expect(recorder.getState()).toBe('inactive');
      expect(recorder.mediaRecorder).toBeNull();
    });

    it('should allow retry after error', async () => {
      const recorder = new AudioRecorder();
      
      // First attempt fails
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValueOnce(permissionError);

      try {
        await recorder.start();
      } catch (error) {
        // Error expected
      }

      // Second attempt succeeds
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await recorder.start();

      expect(recorder.getState()).toBe('recording');
    });
  });

  describe('Audio Format Compatibility - Requirement 5.1', () => {
    it('should check MediaRecorder MIME type support on initialization', async () => {
      const recorder = new AudioRecorder();
      
      // Spy on isTypeSupported to verify it's called
      const isTypeSupportedSpy = vi.spyOn(MockMediaRecorder, 'isTypeSupported');
      
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await recorder.start();

      // Verify that isTypeSupported was called to check format compatibility
      expect(isTypeSupportedSpy).toHaveBeenCalled();
      
      isTypeSupportedSpy.mockRestore();
    });

    it('should select a Groq-compatible MIME type', async () => {
      const recorder = new AudioRecorder();
      
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await recorder.start();

      // Verify MediaRecorder was created with a supported MIME type
      expect(recorder.mediaRecorder).toBeDefined();
      expect(recorder.mediaRecorder.mimeType).toBeDefined();
      
      // Verify the MIME type is one of the Groq-compatible formats
      const groqCompatibleFormats = [
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];
      
      const isCompatible = groqCompatibleFormats.some(format => 
        recorder.mediaRecorder.mimeType.includes(format)
      );
      
      expect(isCompatible).toBe(true);
    });

    it('should produce Blobs with Groq-compatible MIME types', async () => {
      const recorder = new AudioRecorder();
      
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await recorder.start();
      
      // Simulate data being available
      const mockData = new Blob(['test audio data'], { type: 'audio/webm' });
      if (recorder.mediaRecorder.ondataavailable) {
        recorder.mediaRecorder.ondataavailable({ data: mockData });
      }

      const audioBlob = await recorder.stop();

      // Verify the Blob has a Groq-compatible MIME type
      expect(audioBlob.type).toBeDefined();
      
      const groqCompatibleFormats = [
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];
      
      const isCompatible = groqCompatibleFormats.some(format => 
        audioBlob.type.includes(format)
      );
      
      expect(isCompatible).toBe(true);
    });

    it('should handle fallback when no preferred format is supported', async () => {
      const recorder = new AudioRecorder();
      
      // Mock isTypeSupported to return false for all preferred types
      const originalIsTypeSupported = MockMediaRecorder.isTypeSupported;
      MockMediaRecorder.isTypeSupported = vi.fn(() => false);
      
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await recorder.start();

      // Verify MediaRecorder was still created (with empty string fallback)
      expect(recorder.mediaRecorder).toBeDefined();
      
      // Restore original implementation
      MockMediaRecorder.isTypeSupported = originalIsTypeSupported;
    });

    it('should prioritize formats in order of Groq API preference', async () => {
      const recorder = new AudioRecorder();
      
      const callOrder = [];
      const originalIsTypeSupported = MockMediaRecorder.isTypeSupported;
      
      // Track the order of MIME types checked
      MockMediaRecorder.isTypeSupported = vi.fn((type) => {
        callOrder.push(type);
        // Return true for the first webm format to stop iteration
        return type.includes('audio/webm');
      });
      
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack]
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await recorder.start();

      // Verify that webm formats are checked first (highest priority)
      expect(callOrder[0]).toContain('audio/webm');
      
      // Restore original implementation
      MockMediaRecorder.isTypeSupported = originalIsTypeSupported;
    });
  });
});
