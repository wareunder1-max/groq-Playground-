/**
 * AudioRecorder Component
 * Handles microphone access and audio capture using MediaRecorder API
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1
 */

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  /**
   * Start recording audio from microphone
   * @returns {Promise<void>}
   * @throws {Error} if permission denied or MediaRecorder not supported
   */
  async start() {
    try {
      // Request microphone permission with audio constraints for better quality
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,      // Remove echo
          noiseSuppression: true,       // Remove background noise
          autoGainControl: true,        // Normalize volume
          sampleRate: 48000,            // High quality sample rate
          channelCount: 1               // Mono audio (smaller file size)
        }
      });

      // Determine the best supported audio format
      const mimeType = this._getSupportedMimeType();
      
      // Create MediaRecorder with the audio stream
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000    // Good quality, reasonable file size
      });

      // Reset audio chunks for new recording
      this.audioChunks = [];

      // Collect audio data chunks as they become available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
    } catch (error) {
      // Clean up stream if it was created
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      // Throw descriptive error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone access denied. Please allow microphone permission to use this app.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else {
        throw new Error(`Failed to start recording: ${error.message}`);
      }
    }
  }

  /**
   * Stop recording and return audio data
   * @returns {Promise<Blob>} audio data in webm/mp4/ogg format
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording to stop'));
        return;
      }

      // Set up handler for when recording stops
      this.mediaRecorder.onstop = () => {
        // Create Blob from collected audio chunks
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType
        });

        // Clean up: stop all tracks in the stream
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        // Reset for next recording
        this.audioChunks = [];
        this.mediaRecorder = null;

        resolve(audioBlob);
      };

      // Handle errors during stop
      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event.error}`));
      };

      // Stop the recording
      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording state
   * @returns {'inactive' | 'recording' | 'paused'}
   */
  getState() {
    if (!this.mediaRecorder) {
      return 'inactive';
    }
    return this.mediaRecorder.state;
  }

  /**
   * Check if browser supports audio recording
   * @returns {boolean}
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  /**
   * Get the best supported MIME type for recording
   * Prioritizes formats compatible with Groq API
   * @private
   * @returns {string}
   */
  _getSupportedMimeType() {
    // Groq API supported formats in order of preference
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback to default if none of the preferred types are supported
    return '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioRecorder;
}
