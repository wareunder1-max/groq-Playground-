/**
 * Property-Based Tests for TranscriptionService Component
 * Feature: speech-to-text-app
 * 
 * Tests universal properties that should hold across all valid executions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Import TranscriptionService
const TranscriptionService = (await import('../../js/components/TranscriptionService.js')).default || 
                              (await import('../../js/components/TranscriptionService.js')).TranscriptionService ||
                              global.TranscriptionService;

describe('TranscriptionService Property Tests', () => {
  let fetchMock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a fresh fetch mock for each test
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  /**
   * Property 4: Transcription Service Sends Audio to API
   * **Validates: Requirements 2.1**
   * 
   * For any audio Blob provided to the TranscriptionService, the service should 
   * make an HTTP POST request to the Groq API endpoint with the audio data in 
   * multipart/form-data format.
   */
  it('Property 4: Transcription Service Sends Audio to API', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random API keys
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random audio blob sizes
        fc.integer({ min: 100, max: 10000 }),
        // Generate random model names
        fc.constantFrom('whisper-large-v3', 'whisper-large-v2', 'whisper-medium'),
        async (apiKey, blobSize, model) => {
          // Create a fresh mock for this iteration
          const localFetchMock = vi.fn();
          global.fetch = localFetchMock;
          
          // Create a mock audio blob
          const audioBlob = new Blob(['x'.repeat(blobSize)], { type: 'audio/webm' });

          // Mock successful API response
          localFetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ text: 'mock transcription' })
          });

          const service = new TranscriptionService(apiKey);
          await service.transcribe(audioBlob, model);

          // Verify fetch was called
          expect(localFetchMock).toHaveBeenCalledTimes(1);

          // Get the call arguments
          const [url, options] = localFetchMock.mock.calls[0];

          // Verify correct endpoint
          expect(url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');

          // Verify POST method
          expect(options.method).toBe('POST');

          // Verify body is FormData
          expect(options.body).toBeInstanceOf(FormData);

          // Verify FormData contains the audio file and model
          const formData = options.body;
          expect(formData.has('file')).toBe(true);
          expect(formData.has('model')).toBe(true);
          expect(formData.get('model')).toBe(model);
        }
      ),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 10: API Requests Include Required Headers
   * **Validates: Requirements 5.2, 5.3**
   * 
   * For any transcription API request, the HTTP headers should include both 
   * the Authorization header with the Bearer token and the correct Content-Type 
   * for multipart/form-data.
   */
  it('Property 10: API Requests Include Required Headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random API keys
        fc.string({ minLength: 20, maxLength: 100 }),
        // Generate random blob content
        fc.string({ minLength: 100, maxLength: 1000 }),
        async (apiKey, blobContent) => {
          // Create a fresh mock for this iteration
          const localFetchMock = vi.fn();
          global.fetch = localFetchMock;
          
          // Create a mock audio blob
          const audioBlob = new Blob([blobContent], { type: 'audio/webm' });

          // Mock successful API response
          localFetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ text: 'transcription result' })
          });

          const service = new TranscriptionService(apiKey);
          await service.transcribe(audioBlob);

          // Verify fetch was called
          expect(localFetchMock).toHaveBeenCalledTimes(1);

          // Get the call arguments
          const [, options] = localFetchMock.mock.calls[0];

          // Verify Authorization header is present with Bearer token
          expect(options.headers).toBeDefined();
          expect(options.headers.Authorization).toBe(`Bearer ${apiKey}`);

          // Note: Content-Type for multipart/form-data is automatically set by the browser
          // when using FormData, so we don't explicitly set it in the code.
          // We verify that the body is FormData, which ensures proper Content-Type.
          expect(options.body).toBeInstanceOf(FormData);
        }
      ),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Additional property: Service handles various error responses correctly
   */
  it('Property: Service handles API error responses correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom(401, 429, 500, 502, 503),
        async (apiKey, statusCode) => {
          // Create a fresh mock for this iteration
          const localFetchMock = vi.fn();
          global.fetch = localFetchMock;
          
          const audioBlob = new Blob(['test'], { type: 'audio/webm' });

          // Mock error response
          localFetchMock.mockResolvedValueOnce({
            ok: false,
            status: statusCode,
            json: async () => ({ error: { message: 'API error' } })
          });

          const service = new TranscriptionService(apiKey);

          // Verify that the service throws an error
          await expect(service.transcribe(audioBlob)).rejects.toThrow();

          // Verify specific error messages based on status code
          try {
            // Reset mock for second call
            localFetchMock.mockResolvedValueOnce({
              ok: false,
              status: statusCode,
              json: async () => ({ error: { message: 'API error' } })
            });
            
            await service.transcribe(audioBlob);
          } catch (error) {
            if (statusCode === 401) {
              expect(error.message).toContain('Invalid API key');
            } else if (statusCode === 429) {
              expect(error.message).toContain('Rate limit');
            } else if (statusCode >= 500) {
              expect(error.message).toContain('Service temporarily unavailable');
            }
          }
        }
      ),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Additional property: Service validates input correctly
   */
  it('Property: Service validates invalid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        async (apiKey) => {
          const service = new TranscriptionService(apiKey);

          // Test with null
          await expect(service.transcribe(null)).rejects.toThrow('Invalid audio data');

          // Test with undefined
          await expect(service.transcribe(undefined)).rejects.toThrow('Invalid audio data');

          // Test with non-Blob object
          await expect(service.transcribe({ not: 'a blob' })).rejects.toThrow('Invalid audio data');
        }
      ),
      { 
        numRuns: 50,
        verbose: true
      }
    );
  });
});
