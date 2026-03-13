/**
 * Property-Based Tests for AudioRecorder Component
 * Feature: speech-to-text-app
 * 
 * Tests universal properties that should hold across all valid executions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Import AudioRecorder - using dynamic import to handle browser globals
const AudioRecorder = (await import('../../js/components/AudioRecorder.js')).default || 
                      (await import('../../js/components/AudioRecorder.js')).AudioRecorder ||
                      global.AudioRecorder;

describe('AudioRecorder Property Tests', () => {
  beforeEach(() => {
    // Reset any state between tests
    vi.clearAllMocks();
  });

  /**
   * Property 2: Recording Stop Produces Audio Blob
   * **Validates: Requirements 1.4**
   * 
   * For any recording session, when stopped, the AudioRecorder should return 
   * a valid Blob object with a supported audio MIME type and non-zero size.
   */
  it('Property 2: Recording Stop Produces Audio Blob', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random recording durations (in milliseconds)
        fc.integer({ min: 50, max: 200 }),
        async (recordingDuration) => {
          const recorder = new AudioRecorder();

          // Start recording
          await recorder.start();

          // Wait for the specified duration
          await new Promise(resolve => setTimeout(resolve, recordingDuration));

          // Stop recording and get the blob
          const audioBlob = await recorder.stop();

          // Verify the blob is valid
          expect(audioBlob).toBeInstanceOf(Blob);
          
          // Verify the blob has a supported MIME type
          const supportedTypes = [
            'audio/webm',
            'audio/ogg',
            'audio/mp4',
            'audio/mpeg',
            'audio/wav'
          ];
          
          const hasValidType = supportedTypes.some(type => 
            audioBlob.type.includes(type.split(';')[0])
          );
          expect(hasValidType).toBe(true);

          // Verify the blob has non-zero size
          expect(audioBlob.size).toBeGreaterThan(0);
        }
      ),
      { 
        numRuns: 20,
        verbose: true
      }
    );
  });

  /**
   * Property 9: Audio Format Compatibility
   * **Validates: Requirements 5.1**
   * 
   * For any audio Blob produced by AudioRecorder, its MIME type should be 
   * one of the formats supported by Groq API.
   */
  it('Property 9: Audio Format Compatibility', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of recordings
        fc.integer({ min: 1, max: 10 }),
        async (numRecordings) => {
          const groqSupportedFormats = [
            'audio/webm',
            'audio/mp4',
            'audio/ogg',
            'audio/mpeg',
            'audio/wav'
          ];

          for (let i = 0; i < numRecordings; i++) {
            const recorder = new AudioRecorder();
            
            await recorder.start();
            await new Promise(resolve => setTimeout(resolve, 100));
            const audioBlob = await recorder.stop();

            // Check if the MIME type is Groq-compatible
            const isCompatible = groqSupportedFormats.some(format => 
              audioBlob.type.includes(format.split(';')[0])
            );

            expect(isCompatible).toBe(true);
          }
        }
      ),
      { 
        numRuns: 20,
        verbose: true
      }
    );
  });

  /**
   * Property: Recording state transitions correctly
   * Verifies that the recorder state follows the expected lifecycle
   */
  it('Property: Recording state transitions correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 20, max: 100 }),
        async (duration) => {
          const recorder = new AudioRecorder();

          // Initial state should be inactive
          expect(recorder.getState()).toBe('inactive');

          // Start recording
          await recorder.start();
          
          // State should be recording
          expect(recorder.getState()).toBe('recording');

          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, duration));

          // Stop recording
          const stopPromise = recorder.stop();
          
          // After stop is called, eventually state should be inactive
          await stopPromise;
          expect(recorder.getState()).toBe('inactive');
        }
      ),
      { 
        numRuns: 20,
        verbose: true
      }
    );
  });
});
