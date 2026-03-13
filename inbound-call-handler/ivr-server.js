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

// IVR Configuration
const IVR_CONFIG = {
  supportedLanguages: ['urdu', 'english', 'punjabi', 'pashto', 'sindhi'],
  
  greetings: {
    initial: "صبح بخیر۔ میں ایک AI اسسٹنٹ ہوں۔ میں کئی زبانوں میں بات کر سکتا ہوں، جیسے کہ اردو، انگلش، پنجابی، سندھی اور پشتو۔ آپ کس زبان میں بات کرنا پسند کریں گے؟",
    // "Subha bakhair. Main aik AI assistant hoon. Main kayee zabanoon mein baat kar sakta hoon, jaise ke Urdu, English, Punjabi, Sindhi aur Pashto. Aap kis zaban mein baat karna pasand karenge?"
  },
  
  responses: {
    languageNotSupported: "معذرت کے ساتھ، مجھے یہ زبان نہیں آتی۔ لیکن آپ اردو، انگلش، پنجابی، سندھی یا پشتو میں ضرور بات کر سکتے ہیں۔",
    // "Mazrat ke sath, mujhe yeh zaban nahi aati. Lekin aap Urdu, English, Punjabi, Sindhi ya Pashto mein zaroor baat kar sakte hain."
    
    languageConfirmed: {
      urdu: "بہت اچھا! میں آپ کی کیسے مدد کر سکتا ہوں؟",
      english: "Great! How can I help you today?",
      punjabi: "بہت ودھیا! میں تہاڈی کی مدد کر سکدا ہاں؟",
      pashto: "ډیره ښه! زه څنګه مرسته کولی شم؟",
      sindhi: "تمام سٺو! مان توهان جي ڪيئن مدد ڪري سگهان ٿو؟"
    },
    
    intentConfirmation: {
      balance: "آپ اپنا بیلنس جاننا چاہتے ہیں۔ کیا یہ درست ہے؟",
      statement: "آپ اپنا اکاؤنٹ سٹیٹمنٹ چاہتے ہیں۔ کیا یہ درست ہے؟",
      branches: "آپ قریبی برانچ کی معلومات چاہتے ہیں۔ کیا یہ درست ہے؟",
      loan: "آپ لون کی معلومات چاہتے ہیں۔ کیا یہ درست ہے؟",
      complaint: "آپ شکایت درج کرانا چاہتے ہیں۔ کیا یہ درست ہے؟"
    }
  },
  
  intents: [
    { name: 'balance', keywords: ['balance', 'بیلنس', 'رقم', 'amount', 'پیسے', 'money'] },
    { name: 'statement', keywords: ['statement', 'سٹیٹمنٹ', 'تفصیل', 'details', 'لین دین', 'transaction'] },
    { name: 'branches', keywords: ['branch', 'برانچ', 'دفتر', 'office', 'location', 'جگہ'] },
    { name: 'loan', keywords: ['loan', 'قرض', 'قرضہ', 'financing', 'فنانسنگ'] },
    { name: 'complaint', keywords: ['complaint', 'شکایت', 'problem', 'مسئلہ', 'issue'] }
  ]
};

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, data };
  
  const emoji = { 'INFO': 'ℹ️', 'SUCCESS': '✅', 'ERROR': '❌', 'WARNING': '⚠️', 'DEBUG': '🔍' };
  console.log(`${emoji[level] || '📝'} [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOGS_DIR, `ivr-handler-${dateStr}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Call-specific logging
function logCall(callId, event, details = null) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, callId, event, details };
  
  const callLogFile = path.join(LOGS_DIR, `call-${callId}.log`);
  fs.appendFileSync(callLogFile, JSON.stringify(logEntry) + '\n');
  
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

      // Create IVR session
      const session = {
        id: callId,
        channelId: channel.id,
        from: callerNumber,
        language: null,
        intent: null,
        conversationHistory: [],
        state: 'GREETING',
        createdAt: new Date(),
        isActive: true
      };
      callSessions.set(callId, session);

      try {
        await channel.answer();
        logCall(callId, 'CALL_ANSWERED');

        // Start IVR flow
        await handleIVRFlow(ari, channel, session);

      } catch (error) {
        logCall(callId, 'ERROR', { error: error.message, stack: error.stack });
        await hangupCall(channel, callId);
      }
    });

    // Handle call hangup
    ari.on('StasisEnd', (event, channel) => {
      const callId = channel.id;
      logCall(callId, 'CALL_ENDED');
      callSessions.delete(callId);
    });

    ari.on('ChannelDestroyed', (event, channel) => {
      const callId = channel.id;
      logCall(callId, 'CHANNEL_DESTROYED');
      callSessions.delete(callId);
    });
  }
);

// Main IVR Flow Handler
async function handleIVRFlow(ari, channel, session) {
  const callId = session.id;
  
  try {
    // Step 1: Play greeting and ask for language
    session.state = 'LANGUAGE_SELECTION';
    await playMessage(ari, channel, IVR_CONFIG.greetings.initial, callId);
    
    // Step 2: Get language choice
    const languageResponse = await recordAndTranscribe(ari, channel, callId, 10, 2);
    
    if (!languageResponse) {
      await playMessage(ari, channel, "معذرت، میں نے آپ کی آواز نہیں سنی۔ براہ کرم دوبارہ کوشش کریں۔", callId);
      await hangupCall(channel, callId);
      return;
    }
    
    const detectedLanguage = detectLanguage(languageResponse);
    session.language = detectedLanguage;
    
    logCall(callId, 'LANGUAGE_DETECTED', { 
      transcription: languageResponse,
      language: detectedLanguage 
    });
    
    if (!detectedLanguage || !IVR_CONFIG.supportedLanguages.includes(detectedLanguage)) {
      await playMessage(ari, channel, IVR_CONFIG.responses.languageNotSupported, callId);
      await hangupCall(channel, callId);
      return;
    }
    
    // Confirm language
    const confirmation = IVR_CONFIG.responses.languageConfirmed[detectedLanguage];
    await playMessage(ari, channel, confirmation, callId);
    
    // Step 3: Get intent
    session.state = 'INTENT_DETECTION';
    const intentResponse = await recordAndTranscribe(ari, channel, callId, 30, 3);
    
    if (!intentResponse) {
      await playMessage(ari, channel, "معذرت، میں نے آپ کی آواز نہیں سنی۔", callId);
      await hangupCall(channel, callId);
      return;
    }
    
    const detectedIntent = detectIntent(intentResponse);
    session.intent = detectedIntent;
    
    logCall(callId, 'INTENT_DETECTED', { 
      transcription: intentResponse,
      intent: detectedIntent 
    });
    
    if (detectedIntent && IVR_CONFIG.responses.intentConfirmation[detectedIntent]) {
      await playMessage(ari, channel, IVR_CONFIG.responses.intentConfirmation[detectedIntent], callId);
    } else {
      await playMessage(ari, channel, `آپ کا مطلب ہے: ${intentResponse}`, callId);
    }
    
    // Step 4: Goodbye
    await playMessage(ari, channel, "شکریہ۔ اللہ حافظ۔", callId);
    await hangupCall(channel, callId);
    
  } catch (error) {
    logCall(callId, 'IVR_FLOW_ERROR', { error: error.message, stack: error.stack });
    await hangupCall(channel, callId);
  }
}

// Record and transcribe with barge-in support
async function recordAndTranscribe(ari, channel, callId, maxDuration = 30, maxSilence = 3) {
  const timestamp = Date.now();
  const recordingName = `ivr_recording_${timestamp}`;
  const recordingPath = `/var/spool/asterisk/recording/${recordingName}.wav`;
  
  try {
    logCall(callId, 'RECORDING_START', { maxDuration, maxSilence });
    
    const recordUrl = `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/channels/${channel.id}/record`;
    
    const recordParams = {
      name: recordingName,
      format: 'wav',
      maxDurationSeconds: maxDuration,
      maxSilenceSeconds: maxSilence,
      ifExists: 'overwrite',
      beep: false,
      terminateOn: 'none'
    };
    
    await axios.post(recordUrl, null, {
      params: recordParams,
      auth: {
        username: process.env.ASTERISK_USERNAME,
        password: process.env.ASTERISK_PASSWORD
      }
    });
    
    // Wait for recording to finish
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), (maxDuration + 2) * 1000);
      
      const finishedHandler = (event) => {
        if (event.recording && event.recording.name === recordingName) {
          clearTimeout(timeout);
          ari.removeListener('RecordingFinished', finishedHandler);
          ari.removeListener('RecordingFailed', failedHandler);
          resolve();
        }
      };
      
      const failedHandler = (event) => {
        if (event.recording && event.recording.name === recordingName) {
          clearTimeout(timeout);
          ari.removeListener('RecordingFinished', finishedHandler);
          ari.removeListener('RecordingFailed', failedHandler);
          reject(new Error('Recording failed'));
        }
      };
      
      ari.on('RecordingFinished', finishedHandler);
      ari.on('RecordingFailed', failedHandler);
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!fs.existsSync(recordingPath)) {
      logCall(callId, 'RECORDING_NOT_FOUND', { path: recordingPath });
      return null;
    }
    
    const fileSize = fs.statSync(recordingPath).size;
    
    if (fileSize < 1000) {
      logCall(callId, 'RECORDING_TOO_SHORT', { size: fileSize });
      fs.unlinkSync(recordingPath);
      return null;
    }
    
    // Transcribe
    const transcription = await transcribeAudio(recordingPath, callId);
    
    // Cleanup
    fs.unlinkSync(recordingPath);
    
    return transcription;
    
  } catch (error) {
    logCall(callId, 'RECORD_TRANSCRIBE_ERROR', { error: error.message });
    return null;
  }
}

// Detect language from transcription
function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  
  // Check for language keywords
  if (lowerText.includes('urdu') || lowerText.includes('اردو')) return 'urdu';
  if (lowerText.includes('english') || lowerText.includes('انگلش') || lowerText.includes('انگریزی')) return 'english';
  if (lowerText.includes('punjabi') || lowerText.includes('panjabi') || lowerText.includes('پنجابی')) return 'punjabi';
  if (lowerText.includes('pashto') || lowerText.includes('پشتو')) return 'pashto';
  if (lowerText.includes('sindhi') || lowerText.includes('سندھی')) return 'sindhi';
  
  // Check if text contains Urdu script
  if (/[\u0600-\u06FF]/.test(text)) return 'urdu';
  
  return 'urdu'; // Default to Urdu
}

// Detect intent from transcription
function detectIntent(text) {
  const lowerText = text.toLowerCase();
  
  for (const intent of IVR_CONFIG.intents) {
    for (const keyword of intent.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return intent.name;
      }
    }
  }
  
  return null;
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

    const fileName = `tts_${uuidv4()}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(response.data));

    logCall(callId, 'TTS_SAVED', { file: fileName, size: response.data.byteLength });
    
    return fileName;
  } catch (error) {
    logCall(callId, 'TTS_ERROR', { error: error.message });
    throw error;
  }
}

// Play message with barge-in support
async function playMessage(ari, channel, message, callId) {
  try {
    const audioFile = await textToSpeech(message, callId);
    const filePath = path.join(AUDIO_DIR, audioFile);
    const filePathWithoutExt = filePath.replace('.mp3', '');
    
    logCall(callId, 'PLAYBACK_START', { file: audioFile });
    
    const playback = ari.Playback();
    await channel.play({ media: `sound:${filePathWithoutExt}` }, playback);
    
    await new Promise((resolve) => {
      playback.on('PlaybackFinished', resolve);
    });

    logCall(callId, 'PLAYBACK_FINISHED');
    fs.unlinkSync(filePath);
  } catch (error) {
    logCall(callId, 'PLAYBACK_ERROR', { error: error.message });
  }
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

log('SUCCESS', 'IVR Call Handler started', {
  app_name: process.env.ASTERISK_APP_NAME,
  supported_languages: IVR_CONFIG.supportedLanguages
});
log('INFO', 'Waiting for incoming calls...');
