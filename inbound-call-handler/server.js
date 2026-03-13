const ariClient = require('ari-client');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Store active call sessions
const callSessions = new Map();

// Ensure audio directory exists (use /tmp for TTS files)
const AUDIO_DIR = '/tmp/asterisk-audio';
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Ensure logs directory exists
const LOGS_DIR = '/var/log/inbound-call-handler';
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  // Console output with emoji
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'DEBUG': '🔍'
  };
  console.log(`${emoji[level] || '📝'} [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  
  // Write to daily log file
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOGS_DIR, `call-handler-${dateStr}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(logFile, logLine);
}

// Call-specific logging
function logCall(callId, event, details = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    callId,
    event,
    details
  };
  
  // Write to call-specific log file
  const callLogFile = path.join(LOGS_DIR, `call-${callId}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(callLogFile, logLine);
  
  // Also write to main log
  log('INFO', `Call ${callId}: ${event}`, details);
}

// Connect to Asterisk ARI
ariClient.connect(
  `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}`,
  process.env.ASTERISK_USERNAME,
  process.env.ASTERISK_PASSWORD,
  async (err, ari) => {
    if (err) {
      log('ERROR', 'Failed to connect to Asterisk ARI', { error: err.message });
      process.exit(1);
    }

    log('SUCCESS', 'Connected to Asterisk ARI', {
      host: process.env.ASTERISK_HOST,
      port: process.env.ASTERISK_PORT,
      app: process.env.ASTERISK_APP_NAME
    });

    // Start the Stasis application
    ari.start(process.env.ASTERISK_APP_NAME);

    // Handle incoming calls
    ari.on('StasisStart', async (event, channel) => {
      const callId = channel.id;
      const callerNumber = event.channel.caller.number;

      logCall(callId, 'INCOMING_CALL', {
        from: callerNumber,
        channelId: channel.id,
        timestamp: new Date().toISOString()
      });

      // Create session for this call
      const session = {
        id: callId,
        channelId: channel.id,
        from: callerNumber,
        conversationHistory: [],
        createdAt: new Date(),
        isActive: true
      };
      callSessions.set(callId, session);

      try {
        // Answer the call
        await channel.answer();
        logCall(callId, 'CALL_ANSWERED');

        // Play greeting
        await playGreeting(ari, channel, callId);

        // Start conversation loop
        await handleConversation(ari, channel, session);

      } catch (error) {
        logCall(callId, 'ERROR', { error: error.message, stack: error.stack });
        await hangupCall(channel, callId);
      }
    });

    // Handle call hangup
    ari.on('StasisEnd', (event, channel) => {
      const callId = channel.id;
      logCall(callId, 'CALL_ENDED');
      
      // Clean up session
      callSessions.delete(callId);
    });

    // Handle channel destroyed
    ari.on('ChannelDestroyed', (event, channel) => {
      const callId = channel.id;
      logCall(callId, 'CHANNEL_DESTROYED');
      callSessions.delete(callId);
    });
  }
);

// Play greeting message with language selection
async function playGreeting(ari, channel, callId) {
  try {
    // Friendly multilingual greeting in Urdu
    const greeting = "صبح بخیر۔ میں ایک AI اسسٹنٹ ہوں۔ میں کئی زبانوں میں بات کر سکتا ہوں، جیسے کہ اردو، انگلش، پنجابی اور پشتو۔ آپ کس زبان میں بات کرنا پسند کریں گے؟";
    
    logCall(callId, 'PLAYING_GREETING', { text: greeting });
    
    const audioFile = await textToSpeech(greeting, callId);
    const filePath = path.join(AUDIO_DIR, audioFile);
    const filePathWithoutExt = filePath.replace('.mp3', '');
    
    // Play the audio file
    const playback = ari.Playback();
    await channel.play({ media: `sound:${filePathWithoutExt}` }, playback);
    
    // Wait for playback to finish
    await new Promise((resolve) => {
      playback.on('PlaybackFinished', resolve);
    });
    
    logCall(callId, 'GREETING_PLAYED');
    
    // Clean up audio file
    fs.unlinkSync(filePath);
  } catch (error) {
    logCall(callId, 'ERROR_PLAYING_GREETING', { error: error.message });
  }
}

// Main conversation loop
async function handleConversation(ari, channel, session) {
  const callId = session.id;
  let turnNumber = 0;
  
  while (session.isActive) {
    try {
      turnNumber++;
      logCall(callId, 'CONVERSATION_TURN_START', { turn: turnNumber });
      
      // Record user speech using direct ARI HTTP API (bypassing ari-client wrapper)
      logCall(callId, 'RECORDING_START', { channelId: channel.id });
      
      // Create unique recording name (no path, just the name)
      const timestamp = Date.now();
      const recordingName = `ai_recording_${timestamp}`;
      
      // Asterisk saves recordings to /var/spool/asterisk/recording/ by default
      const recordingPath = `/var/spool/asterisk/recording/${recordingName}.wav`;
      
      try {
        // Use direct HTTP POST to ARI endpoint (like AVA project does)
        // This bypasses the ari-client library which has issues with the record() method
        const recordUrl = `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/channels/${channel.id}/record`;
        
        const recordParams = {
          name: recordingName,
          format: 'wav',
          maxDurationSeconds: 30,
          maxSilenceSeconds: 3,
          ifExists: 'overwrite',
          beep: false,
          terminateOn: 'none'
        };
        
        logCall(callId, 'RECORDING_API_CALL', {
          url: recordUrl,
          params: recordParams
        });
        
        const recordResponse = await axios.post(recordUrl, null, {
          params: recordParams,
          auth: {
            username: process.env.ASTERISK_USERNAME,
            password: process.env.ASTERISK_PASSWORD
          }
        });
        
        logCall(callId, 'RECORDING_STARTED', { 
          recording_name: recordingName,
          channel_id: channel.id,
          response: recordResponse.data
        });
        
        // Listen for recording events via ARI
        const recordingFinished = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            logCall(callId, 'RECORDING_TIMEOUT');
            resolve();
          }, 33000); // 30s max + 3s buffer
          
          const finishedHandler = (event) => {
            if (event.recording && event.recording.name === recordingName) {
              clearTimeout(timeout);
              logCall(callId, 'RECORDING_FINISHED_EVENT', event);
              ari.removeListener('RecordingFinished', finishedHandler);
              ari.removeListener('RecordingFailed', failedHandler);
              resolve();
            }
          };
          
          const failedHandler = (event) => {
            if (event.recording && event.recording.name === recordingName) {
              clearTimeout(timeout);
              logCall(callId, 'RECORDING_FAILED_EVENT', event);
              ari.removeListener('RecordingFinished', finishedHandler);
              ari.removeListener('RecordingFailed', failedHandler);
              reject(new Error('Recording failed'));
            }
          };
          
          ari.on('RecordingFinished', finishedHandler);
          ari.on('RecordingFailed', failedHandler);
        });
        
        // Wait for recording to finish
        await recordingFinished;
        
        // Wait a bit for file to be fully written
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!fs.existsSync(recordingPath)) {
          logCall(callId, 'ERROR', { 
            message: 'Recording file not found',
            expected_path: recordingPath
          });
          continue;
        }
        
        logCall(callId, 'RECORDING_COMPLETE', { 
          file: recordingPath,
          recording_name: recordingName
        });
        
      } catch (recordError) {
        logCall(callId, 'RECORDING_ERROR', { 
          error: recordError.message,
          response: recordError.response?.data,
          stack: recordError.stack
        });
        throw recordError;
      }

      const fileSize = fs.statSync(recordingPath).size;
      logCall(callId, 'RECORDING_FILE_INFO', { size: fileSize, path: recordingPath });

      // Check if recording is too small (silent or empty)
      if (fileSize < 1000) { // Less than 1KB is likely silent
        logCall(callId, 'RECORDING_TOO_SHORT', { 
          size: fileSize,
          message: 'Recording too short or silent, skipping turn'
        });
        
        // Clean up the empty recording
        try {
          fs.unlinkSync(recordingPath);
        } catch (cleanupError) {
          logCall(callId, 'RECORDING_CLEANUP_ERROR', { error: cleanupError.message });
        }
        
        // Continue to next turn
        continue;
      }

      // 1. Speech to Text (Groq Whisper)
      const startTranscribe = Date.now();
      const transcription = await transcribeAudio(recordingPath, callId);
      const transcribeTime = Date.now() - startTranscribe;
      
      logCall(callId, 'TRANSCRIPTION_COMPLETE', {
        text: transcription,
        duration_ms: transcribeTime,
        turn: turnNumber
      });

      // Check for exit commands
      if (transcription.toLowerCase().includes('goodbye') || 
          transcription.toLowerCase().includes('hang up')) {
        logCall(callId, 'EXIT_COMMAND_DETECTED', { command: transcription });
        await playMessage(ari, channel, "Goodbye! Have a great day!", callId);
        break;
      }

      // 2. Get AI Response (Groq LLaMA)
      const startAI = Date.now();
      const aiResponse = await getAIResponse(session, transcription, callId);
      const aiTime = Date.now() - startAI;
      
      logCall(callId, 'AI_RESPONSE_GENERATED', {
        response: aiResponse,
        duration_ms: aiTime,
        turn: turnNumber
      });

      // 3. Text to Speech (ElevenLabs)
      const startTTS = Date.now();
      const audioFile = await textToSpeech(aiResponse, callId);
      const ttsTime = Date.now() - startTTS;
      
      logCall(callId, 'TTS_COMPLETE', {
        audio_file: audioFile,
        duration_ms: ttsTime
      });

      // 4. Play response to caller
      await playAudioFile(ari, channel, audioFile, callId);

      // Clean up recording file
      try {
        fs.unlinkSync(recordingPath);
        logCall(callId, 'RECORDING_FILE_DELETED', { file: recordingPath });
      } catch (cleanupError) {
        logCall(callId, 'RECORDING_CLEANUP_ERROR', { error: cleanupError.message });
      }

      logCall(callId, 'CONVERSATION_TURN_END', { turn: turnNumber });

    } catch (error) {
      logCall(callId, 'ERROR_IN_CONVERSATION', {
        error: error.message,
        stack: error.stack,
        turn: turnNumber
      });
      break;
    }
  }

  // End call
  await hangupCall(channel, callId);
}

// Groq Whisper - Speech to Text
async function transcribeAudio(audioFilePath, callId) {
  try {
    logCall(callId, 'TRANSCRIPTION_START', { file: audioFilePath });
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-large-v3');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );

    return response.data.text;
  } catch (error) {
    logCall(callId, 'TRANSCRIPTION_ERROR', {
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

// Groq LLaMA - AI Response
async function getAIResponse(session, userMessage, callId) {
  try {
    logCall(callId, 'AI_REQUEST_START', { user_message: userMessage });
    
    session.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const messages = session.conversationHistory.length === 1
      ? [
          {
            role: 'system',
            content: 'You are a helpful AI assistant handling phone calls. Keep responses VERY SHORT (1-2 sentences max, 20-30 words). Be friendly, professional, and conversational. Speak naturally as if talking on the phone. Never list multiple items or give long explanations.'
          },
          ...session.conversationHistory
        ]
      : session.conversationHistory;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = response.data.choices[0].message.content;

    session.conversationHistory.push({
      role: 'assistant',
      content: aiMessage
    });

    return aiMessage;
  } catch (error) {
    logCall(callId, 'AI_RESPONSE_ERROR', {
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

// ElevenLabs - Text to Speech
async function textToSpeech(text, callId) {
  try {
    logCall(callId, 'TTS_START', { text: text });
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save audio file
    const fileName = `tts_${uuidv4()}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(response.data));

    logCall(callId, 'TTS_SAVED', {
      file: fileName,
      size: response.data.byteLength
    });
    
    return fileName;
  } catch (error) {
    logCall(callId, 'TTS_ERROR', {
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

// Play audio file to caller
async function playAudioFile(ari, channel, fileName, callId) {
  try {
    logCall(callId, 'PLAYBACK_START', { file: fileName });
    
    const playback = ari.Playback();
    const filePath = path.join(AUDIO_DIR, fileName);
    
    // Use absolute file path for playback
    // Remove extension as Asterisk adds it automatically
    const filePathWithoutExt = filePath.replace('.mp3', '');
    
    await channel.play({ media: `sound:${filePathWithoutExt}` }, playback);
    
    // Wait for playback to finish
    await new Promise((resolve) => {
      playback.on('PlaybackFinished', resolve);
    });

    logCall(callId, 'PLAYBACK_FINISHED');

    // Clean up audio file
    fs.unlinkSync(filePath);
  } catch (error) {
    logCall(callId, 'PLAYBACK_ERROR', { error: error.message });
  }
}

// Play simple message
async function playMessage(ari, channel, message, callId) {
  const audioFile = await textToSpeech(message, callId);
  await playAudioFile(ari, channel, audioFile, callId);
}

// Hangup call
async function hangupCall(channel, callId) {
  try {
    await channel.hangup();
    logCall(callId, 'CALL_HANGUP');
  } catch (error) {
    logCall(callId, 'HANGUP_ERROR', { error: error.message });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('INFO', 'Shutting down gracefully...');
  process.exit(0);
});

log('SUCCESS', 'Asterisk AI Call Handler started', {
  app_name: process.env.ASTERISK_APP_NAME,
  asterisk_host: process.env.ASTERISK_HOST,
  asterisk_port: process.env.ASTERISK_PORT
});
log('INFO', 'Waiting for incoming calls...');
