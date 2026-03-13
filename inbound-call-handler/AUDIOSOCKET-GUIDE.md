# Asterisk AudioSocket for Real-Time Streaming

## What is AudioSocket?

AudioSocket is an Asterisk application that streams raw audio bidirectionally over a TCP socket. This allows you to:
- Receive audio in real-time (no recording needed)
- Send audio back to the caller (no file playback needed)
- Implement true conversational AI with minimal latency

## Benefits for IVR

### 1. Real-Time Transcription
- Stream audio directly to Groq Whisper
- No need to wait for silence
- Transcribe as customer speaks

### 2. Natural Barge-In
- Detect when customer starts speaking
- Stop TTS playback immediately
- More human-like conversation

### 3. Lower Latency
- No file I/O overhead
- Direct streaming
- Faster response times

### 4. Better User Experience
- Feels more responsive
- Natural conversation flow
- Less waiting

## How It Works

```
[Customer Speaks]
       ↓
[Asterisk AudioSocket]
       ↓
[TCP Socket Stream] → [Your Node.js Server]
       ↓
[Groq Whisper API] (real-time transcription)
       ↓
[Groq LLaMA API] (AI response)
       ↓
[ElevenLabs TTS]
       ↓
[TCP Socket Stream] → [Asterisk AudioSocket]
       ↓
[Customer Hears Response]
```

## Asterisk Configuration

### 1. Enable AudioSocket Module

```ini
; /etc/asterisk/modules.conf
[modules]
load => app_audiosocket.so
```

### 2. Dialplan Configuration

```ini
; /etc/asterisk/extensions.conf
[from-internal]
exten => 9995,1,NoOp(AI Call Handler with AudioSocket)
 same => n,Answer()
 same => n,AudioSocket(uuid,localhost:9999)
 same => n,Hangup()
```

### 3. Restart Asterisk

```bash
asterisk -rx "module load app_audiosocket.so"
asterisk -rx "core reload"
```

## Node.js Implementation

### Basic AudioSocket Server

```javascript
const net = require('net');
const { Readable, Writable } = require('stream');

// AudioSocket Protocol
const AUDIOSOCKET_UUID_SIZE = 16;
const AUDIOSOCKET_HEADER_SIZE = 3;

class AudioSocketServer {
  constructor(port = 9999) {
    this.port = port;
    this.server = null;
  }

  start() {
    this.server = net.createServer((socket) => {
      console.log('AudioSocket client connected');
      
      // Read UUID (first 16 bytes)
      socket.once('data', (data) => {
        const uuid = data.slice(0, AUDIOSOCKET_UUID_SIZE).toString('hex');
        console.log('Call UUID:', uuid);
        
        // Handle audio stream
        this.handleAudioStream(socket, uuid);
      });
      
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
      
      socket.on('end', () => {
        console.log('AudioSocket client disconnected');
      });
    });
    
    this.server.listen(this.port, () => {
      console.log(`AudioSocket server listening on port ${this.port}`);
    });
  }
  
  handleAudioStream(socket, uuid) {
    let buffer = Buffer.alloc(0);
    
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      // Process complete frames
      while (buffer.length >= AUDIOSOCKET_HEADER_SIZE) {
        const kind = buffer.readUInt8(0);
        const length = buffer.readUInt16BE(1);
        
        if (buffer.length < AUDIOSOCKET_HEADER_SIZE + length) {
          break; // Wait for more data
        }
        
        const payload = buffer.slice(AUDIOSOCKET_HEADER_SIZE, AUDIOSOCKET_HEADER_SIZE + length);
        buffer = buffer.slice(AUDIOSOCKET_HEADER_SIZE + length);
        
        if (kind === 0x10) { // Audio frame (slin16)
          this.processAudioFrame(payload, uuid);
        } else if (kind === 0x00) { // Silence frame
          // Handle silence
        } else if (kind === 0x01) { // Hangup
          console.log('Call hangup');
          socket.end();
        }
      }
    });
  }
  
  processAudioFrame(audioData, uuid) {
    // audioData is raw PCM audio (slin16 format)
    // 16-bit signed linear, 8000 Hz, mono
    
    // Send to transcription service
    // Or buffer and send in chunks
    console.log(`Received ${audioData.length} bytes of audio for ${uuid}`);
  }
  
  sendAudio(socket, audioData) {
    // Send audio back to Asterisk
    const header = Buffer.alloc(AUDIOSOCKET_HEADER_SIZE);
    header.writeUInt8(0x10, 0); // Audio frame
    header.writeUInt16BE(audioData.length, 1);
    
    socket.write(Buffer.concat([header, audioData]));
  }
}

// Start server
const server = new AudioSocketServer(9999);
server.start();
```

## Integration with Groq Whisper

### Real-Time Transcription

```javascript
const FormData = require('form-data');
const axios = require('axios');

class RealtimeTranscriber {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.audioBuffer = Buffer.alloc(0);
    this.minChunkSize = 16000; // 1 second at 8kHz * 2 bytes
  }
  
  addAudioChunk(chunk) {
    this.audioBuffer = Buffer.concat([this.audioBuffer, chunk]);
    
    // Transcribe when we have enough audio
    if (this.audioBuffer.length >= this.minChunkSize) {
      this.transcribe();
    }
  }
  
  async transcribe() {
    if (this.audioBuffer.length === 0) return;
    
    // Convert slin16 to WAV format
    const wavBuffer = this.convertToWav(this.audioBuffer);
    
    // Send to Groq
    const formData = new FormData();
    formData.append('file', wavBuffer, 'audio.wav');
    formData.append('model', 'whisper-large-v3');
    
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          }
        }
      );
      
      console.log('Transcription:', response.data.text);
      
      // Clear buffer after transcription
      this.audioBuffer = Buffer.alloc(0);
      
      return response.data.text;
    } catch (error) {
      console.error('Transcription error:', error.message);
    }
  }
  
  convertToWav(pcmData) {
    // Convert PCM to WAV format
    const wavHeader = Buffer.alloc(44);
    
    // RIFF header
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmData.length, 4);
    wavHeader.write('WAVE', 8);
    
    // fmt chunk
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // fmt chunk size
    wavHeader.writeUInt16LE(1, 20); // PCM format
    wavHeader.writeUInt16LE(1, 22); // Mono
    wavHeader.writeUInt32LE(8000, 24); // Sample rate
    wavHeader.writeUInt32LE(16000, 28); // Byte rate
    wavHeader.writeUInt16LE(2, 32); // Block align
    wavHeader.writeUInt16LE(16, 34); // Bits per sample
    
    // data chunk
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmData.length, 40);
    
    return Buffer.concat([wavHeader, pcmData]);
  }
}
```

## Complete IVR with AudioSocket

```javascript
const net = require('net');
const axios = require('axios');
const FormData = require('form-data');

class AudioSocketIVR {
  constructor(port = 9999) {
    this.port = port;
    this.sessions = new Map();
  }
  
  start() {
    const server = net.createServer((socket) => {
      this.handleConnection(socket);
    });
    
    server.listen(this.port, () => {
      console.log(`AudioSocket IVR listening on port ${this.port}`);
    });
  }
  
  async handleConnection(socket) {
    // Read UUID
    const uuidData = await this.readBytes(socket, 16);
    const uuid = uuidData.toString('hex');
    
    console.log('New call:', uuid);
    
    // Create session
    const session = {
      uuid,
      socket,
      audioBuffer: Buffer.alloc(0),
      conversationHistory: [],
      isListening: true
    };
    
    this.sessions.set(uuid, session);
    
    // Play greeting
    await this.playGreeting(session);
    
    // Start listening for audio
    this.listenForAudio(session);
  }
  
  async playGreeting(session) {
    const greeting = "صبح بخیر! میں آپ کی کیا خدمت کروں؟";
    
    // Generate TTS
    const audioData = await this.textToSpeech(greeting);
    
    // Send to caller
    this.sendAudio(session.socket, audioData);
  }
  
  listenForAudio(session) {
    let buffer = Buffer.alloc(0);
    
    session.socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      while (buffer.length >= 3) {
        const kind = buffer.readUInt8(0);
        const length = buffer.readUInt16BE(1);
        
        if (buffer.length < 3 + length) break;
        
        const payload = buffer.slice(3, 3 + length);
        buffer = buffer.slice(3 + length);
        
        if (kind === 0x10 && session.isListening) {
          // Audio frame
          session.audioBuffer = Buffer.concat([session.audioBuffer, payload]);
          
          // Transcribe when we have 2 seconds of audio
          if (session.audioBuffer.length >= 32000) {
            this.processAudio(session);
          }
        } else if (kind === 0x01) {
          // Hangup
          this.sessions.delete(session.uuid);
          session.socket.end();
        }
      }
    });
  }
  
  async processAudio(session) {
    const audioData = session.audioBuffer;
    session.audioBuffer = Buffer.alloc(0);
    
    // Transcribe
    const text = await this.transcribe(audioData);
    console.log('Customer said:', text);
    
    // Get AI response
    const response = await this.getAIResponse(session, text);
    console.log('AI responds:', response);
    
    // Generate TTS
    const ttsAudio = await this.textToSpeech(response);
    
    // Send to caller
    this.sendAudio(session.socket, ttsAudio);
  }
  
  async transcribe(audioData) {
    // Convert to WAV and send to Groq
    // (Implementation from above)
  }
  
  async getAIResponse(session, text) {
    // Call Groq LLaMA
    // (Implementation from conversational-ivr.js)
  }
  
  async textToSpeech(text) {
    // Call ElevenLabs
    // Convert MP3 to slin16 format
    // (Implementation needed)
  }
  
  sendAudio(socket, audioData) {
    const header = Buffer.alloc(3);
    header.writeUInt8(0x10, 0);
    header.writeUInt16BE(audioData.length, 1);
    socket.write(Buffer.concat([header, audioData]));
  }
  
  readBytes(socket, count) {
    return new Promise((resolve) => {
      const handler = (data) => {
        if (data.length >= count) {
          socket.removeListener('data', handler);
          resolve(data.slice(0, count));
        }
      };
      socket.on('data', handler);
    });
  }
}

// Start IVR
const ivr = new AudioSocketIVR(9999);
ivr.start();
```

## Challenges & Solutions

### Challenge 1: Audio Format Conversion
**Problem**: AudioSocket uses slin16, Groq needs WAV, ElevenLabs returns MP3
**Solution**: Use ffmpeg or audio libraries to convert formats

### Challenge 2: Real-Time Transcription
**Problem**: Groq Whisper needs complete audio files
**Solution**: Buffer audio in chunks (1-2 seconds) and transcribe

### Challenge 3: Barge-In Detection
**Problem**: How to know when customer starts speaking?
**Solution**: Monitor audio amplitude, stop playback when detected

### Challenge 4: Latency
**Problem**: Network delays, API calls
**Solution**: Optimize chunk sizes, use streaming where possible

## Comparison: Current vs AudioSocket

| Feature | Current (Record) | AudioSocket |
|---------|-----------------|-------------|
| **Latency** | 3-5 seconds | 0.5-1 second |
| **Barge-In** | Difficult | Natural |
| **File I/O** | Required | None |
| **Real-Time** | No | Yes |
| **Complexity** | Low | Medium |
| **Performance** | Good | Excellent |

## Next Steps

1. **Install AudioSocket module** in Asterisk
2. **Create TCP server** in Node.js (port 9999)
3. **Implement audio buffering** and chunking
4. **Add format conversion** (slin16 ↔ WAV ↔ MP3)
5. **Test with simple echo** (send back received audio)
6. **Integrate Groq Whisper** for transcription
7. **Integrate ElevenLabs** for TTS
8. **Add barge-in detection**
9. **Optimize chunk sizes** for best latency

## Resources

- [Asterisk AudioSocket Documentation](https://docs.asterisk.org/Asterisk_18_Documentation/API_Documentation/Dialplan_Applications/AudioSocket/)
- [AudioSocket Protocol Spec](https://wiki.asterisk.org/wiki/display/AST/AudioSocket)
- [Node.js Net Module](https://nodejs.org/api/net.html)
- [Audio Format Conversion](https://www.npmjs.com/package/node-wav)

## Conclusion

AudioSocket is the **best approach** for a production conversational IVR:
- ✅ Real-time streaming
- ✅ Natural barge-in
- ✅ Lower latency
- ✅ Better user experience

The current record-based approach works well for demos, but AudioSocket is the way to go for a production system!
