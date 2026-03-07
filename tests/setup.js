// Test setup file for mocking browser APIs

// Mock MediaRecorder API
global.MediaRecorder = class MediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.mimeType = options?.mimeType || 'audio/webm';
    this.ondataavailable = null;
    this.onstop = null;
    this.onerror = null;
  }

  start() {
    this.state = 'recording';
    // Simulate data available after a short delay
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock audio data'], { type: this.mimeType })
        });
      }
    }, 10);
  }

  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      if (this.onstop) {
        this.onstop();
      }
    }, 10);
  }

  static isTypeSupported(type) {
    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4'
    ];
    return supportedTypes.includes(type);
  }
};

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: async (constraints) => {
    if (constraints.audio) {
      return {
        getTracks: () => [{
          stop: () => {}
        }]
      };
    }
    throw new Error('Permission denied');
  }
};

// Mock fetch for API calls
global.fetch = async (url, options) => {
  // This will be overridden in individual tests
  return {
    ok: true,
    status: 200,
    json: async () => ({ text: 'mock transcription' })
  };
};
