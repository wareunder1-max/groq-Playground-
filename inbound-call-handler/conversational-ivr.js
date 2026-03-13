const ariClient = require('ari-client');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Store active call sessions
const callSessions = new Map();

// Ensure audio directory exists
const AUDIO_DIR = '/tmp/asterisk-audio';
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Ensure logs directory exists
const LOGS_DIR = '/var/log/inbound-call-handler';
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// IVR System Prompt - Defines the AI's behavior and knowledge
const IVR_SYSTEM_PROMPT = `You are a friendly AI customer service assistant for a Pakistani bank's phone system.

STRICT RULES:
1. Keep responses under 25 words (CRITICAL - phone calls need short responses)
2. Only provide these services: Balance Inquiry, Account Statement, Branch Locator, Loan Information, Complaints, Customer Support Transfer
3. Only support: Urdu (primary), English (primary), Punjabi/Pashto/Sindhi (recognize but respond in Urdu)
4. Always verify with TPIN for Balance/Statement requests
5. Use DEMO data only - this is a demonstration system
6. Stay in scope - politely redirect out-of-scope requests
7. Be warm, professional, and conversational like a real person

AVAILABLE SERVICES (DEMO ONLY):
1. Balance Inquiry - Requires TPIN verification, provides mock balance "50,000 روپے"
2. Account Statement - Requires TPIN verification, provides mock last 3 transactions
3. Branch Locator - Asks for city, provides mock branch addresses (Lahore, Karachi available)
4. Loan Information - Asks loan type (personal/home/car), provides mock rates
5. Complaint Registration - Records complaint, provides mock reference number
6. Customer Support Transfer - Simulates transfer to human agent

TPIN VERIFICATION (for Balance/Statement):
IMPORTANT: You must ask for TPIN before providing balance or statement.
Say: "بیلنس بتانے سے پہلے، براہ کرم اپنا TPIN بتائیں یا فون سے انٹر کریں۔"
(Before telling balance, please tell your TPIN or enter from phone.)

AFTER CUSTOMER PROVIDES TPIN:
- DO NOT verify yourself - just acknowledge: "شکریہ، آپ کا TPIN چیک کر رہا ہوں۔"
- The system will automatically verify
- If correct, you'll be told to proceed
- If incorrect, you'll be told to ask for retry

OUT OF SCOPE REQUESTS (account opening, card services, investments, etc.):
"معذرت، یہ سروس فی الوقت دستیاب نہیں ہے۔ کیا میں آپ کی کوئی اور مدد کر سکتا ہوں؟"

UNSUPPORTED LANGUAGE:
"معذرت کے ساتھ، مجھے یہ زبان اچھی طرح نہیں آتی۔ کیا آپ اردو یا انگلش میں بات کر سکتے ہیں؟"

DEMO DATA:
- Balance: "آپ کا موجودہ بیلنس 50,000 روپے ہے۔"
- Transactions: "آپ کی آخری تین لین دین: 10 مارچ کو ATM سے 5,000 روپے نکالے، 8 مارچ کو آن لائن 10,000 روپے ٹرانسفر کیے، اور 5 مارچ کو 75,000 روپے تنخواہ جمع ہوئی۔"
- Lahore Branches: "لاہور میں ہماری تین برانچیں ہیں: گلبرگ، ڈیفنس، اور جوہر ٹاؤن۔ کون سی چاہیے؟"
- Karachi Branches: "کراچی میں ہماری دو برانچیں ہیں: کلفٹن اور گلشن۔ کون سی چاہیے؟"
- Loan Rates: Personal 12%, Home 10%, Car 14%

CONVERSATION STYLE:
- Be natural and friendly, like talking to a friend
- Use conversational Urdu, not formal
- Show empathy and understanding
- Keep it brief but warm

Remember: This is a DEMO system. Keep responses SHORT, conversational, stay in scope, be helpful!`;

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, data };
  
  const emoji = { 'INFO': 'ℹ️', 'SUCCESS': '✅', 'ERROR': '❌', 'WARNING': '⚠️', 'DEBUG': '🔍' };
  console.log(`${emoji[level] || '📝'} [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOGS_DIR, `conversational-ivr-${dateStr}.log`);
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

      // Create conversational session
      const session = {
        id: callId,
        channelId: channel.id,
        callerNumber: callerNumber,
        conversationHistory: [],
        metadata: {
          language: null,
          intent: null,
          awaitingTPIN: false,
          tpinVerified: false,
          tpinAttempts: 0,
          requestedService: null
        },
        createdAt: new Date(),
        isActive: true
      };
      callSessions.set(callId, session);

      try {
        await channel.answer();
        logCall(callId, 'CALL_ANSWERED');

        // Start conversational IVR
        await handleConversationalIVR(ari, channel, session);

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

// Main Conversational IVR Handler
async function handleConversationalIVR(ari, channel, session) {
  const callId = session.id;
  let turnNumber = 0;
  
  try {
    // Initial greeting with caller ID
    const greeting = `صبح بخیر! آپ کی کالر آئی ڈی ${session.callerNumber} کے مطابق، آپ ہمارے کسٹمر ہیں۔ بتائیں، میں آپ کی کیا خدمت کروں؟`;
    // "Subha bakhair! Aap ki caller ID {number} ke mutabiq, aap hamare customer hain. Batain, main aap ki kya khidmat karoon?"
    
    await playMessage(ari, channel, greeting, callId);
    
    // Conversational loop
    while (session.isActive) {
      turnNumber++;
      logCall(callId, 'CONVERSATION_TURN_START', { turn: turnNumber });
      
      // Record customer speech
      const customerSpeech = await recordAndTranscribe(ari, channel, callId, 30, 3);
      
      if (!customerSpeech) {
        logCall(callId, 'NO_SPEECH_DETECTED', { turn: turnNumber });
        
        if (turnNumber === 1) {
          await playMessage(ari, channel, "معذرت، میں نے آپ کی آواز نہیں سنی۔ براہ کرم دوبارہ بولیں۔", callId);
          continue;
        } else {
          await playMessage(ari, channel, "شکریہ۔ اللہ حافظ۔", callId);
          break;
        }
      }
      
      logCall(callId, 'CUSTOMER_SPEECH', { 
        turn: turnNumber,
        text: customerSpeech 
      });
      
      // Check for exit commands
      if (isExitCommand(customerSpeech)) {
        logCall(callId, 'EXIT_COMMAND_DETECTED', { command: customerSpeech });
        await playMessage(ari, channel, "شکریہ۔ اللہ حافظ۔", callId);
        break;
      }
      
      // Get AI response
      const aiResponse = await getConversationalResponse(session, customerSpeech, callId);
      
      logCall(callId, 'AI_RESPONSE', {
        turn: turnNumber,
        response: aiResponse
      });
      
      // Play AI response
      await playMessage(ari, channel, aiResponse, callId);
      
      logCall(callId, 'CONVERSATION_TURN_END', { turn: turnNumber });
      
      // Limit conversation to 10 turns for safety
      if (turnNumber >= 10) {
        await playMessage(ari, channel, "شکریہ۔ اگر مزید مدد چاہیے تو دوبارہ کال کریں۔ اللہ حافظ۔", callId);
        break;
      }
    }
    
    await hangupCall(channel, callId);
    
  } catch (error) {
    logCall(callId, 'CONVERSATIONAL_IVR_ERROR', { 
      error: error.message, 
      stack: error.stack 
    });
    await hangupCall(channel, callId);
  }
}

// Check if customer wants to exit
function isExitCommand(text) {
  const exitKeywords = [
    'goodbye', 'bye', 'exit', 'quit', 'hang up',
    'الوداع', 'خدا حافظ', 'اللہ حافظ', 'بائی', 'ٹھیک ہے شکریہ'
  ];
  
  const lowerText = text.toLowerCase();
  return exitKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Get conversational AI response with TPIN validation
async function getConversationalResponse(session, userMessage, callId) {
  try {
    logCall(callId, 'AI_REQUEST_START', { user_message: userMessage });
    
    // Check if this is a TPIN response
    const tpinMatch = userMessage.match(/\b(\d{4})\b/);
    
    if (tpinMatch && session.metadata.awaitingTPIN) {
      const enteredTPIN = tpinMatch[1];
      logCall(callId, 'TPIN_ENTERED', { tpin: enteredTPIN });
      
      if (enteredTPIN === '7878') {
        // TPIN correct
        session.metadata.tpinVerified = true;
        session.metadata.awaitingTPIN = false;
        session.metadata.tpinAttempts = 0;
        
        logCall(callId, 'TPIN_VERIFIED', { success: true });
        
        // Add system message to guide AI
        session.conversationHistory.push({
          role: 'system',
          content: 'TPIN verified successfully. Now provide the requested service (balance or statement).'
        });
        
        // Return verification success message
        return "شکریہ، آپ کا TPIN درست ہے۔ " + (session.metadata.requestedService === 'balance' 
          ? "آپ کا موجودہ بیلنس 50,000 روپے ہے۔ کیا کوئی اور مدد چاہیے؟"
          : "آپ کی آخری تین لین دین: 10 مارچ کو ATM سے 5,000 روپے، 8 مارچ کو آن لائن 10,000 روپے، اور 5 مارچ کو تنخواہ 75,000 روپے۔ کیا کوئی اور مدد چاہیے؟");
        
      } else {
        // TPIN incorrect
        session.metadata.tpinAttempts = (session.metadata.tpinAttempts || 0) + 1;
        
        logCall(callId, 'TPIN_INCORRECT', { 
          attempts: session.metadata.tpinAttempts,
          entered: enteredTPIN 
        });
        
        if (session.metadata.tpinAttempts >= 2) {
          // Max attempts reached
          session.metadata.awaitingTPIN = false;
          session.metadata.tpinAttempts = 0;
          
          return "معذرت، TPIN دوبارہ غلط ہے۔ کیا میں آپ کی کوئی اور مدد کر سکتا ہوں؟";
        } else {
          // Allow retry
          return "معذرت، یہ TPIN ٹھیک نہیں ہے۔ کیا آپ دوبارہ کوشش کریں گے؟";
        }
      }
    }
    
    // Check if user wants to retry after failed TPIN
    if (session.metadata.tpinAttempts > 0 && !session.metadata.awaitingTPIN) {
      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes('ہاں') || lowerMsg.includes('yes') || lowerMsg.includes('جی') || lowerMsg.includes('کوشش')) {
        session.metadata.awaitingTPIN = true;
        return "ٹھیک ہے، براہ کرم اپنا TPIN دوبارہ بتائیں۔";
      } else if (lowerMsg.includes('نہیں') || lowerMsg.includes('no') || lowerMsg.includes('نا')) {
        session.metadata.tpinAttempts = 0;
        return "کوئی بات نہیں۔ میں آپ کی کوئی اور مدد کر سکتا ہوں؟";
      }
    }
    
    // Add user message to history
    session.conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    
    // Detect if user is requesting balance or statement
    const lowerMsg = userMessage.toLowerCase();
    if ((lowerMsg.includes('balance') || lowerMsg.includes('بیلنس')) && !session.metadata.tpinVerified) {
      session.metadata.awaitingTPIN = true;
      session.metadata.requestedService = 'balance';
      session.metadata.tpinAttempts = 0;
    } else if ((lowerMsg.includes('statement') || lowerMsg.includes('سٹیٹمنٹ') || lowerMsg.includes('لین دین')) && !session.metadata.tpinVerified) {
      session.metadata.awaitingTPIN = true;
      session.metadata.requestedService = 'statement';
      session.metadata.tpinAttempts = 0;
    }
    
    // Build messages array with system prompt
    const messages = [
      {
        role: 'system',
        content: IVR_SYSTEM_PROMPT
      },
      ...session.conversationHistory
    ];
    
    // Call Groq LLaMA
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 100, // Keep responses short
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const aiMessage = response.data.choices[0].message.content;
    
    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiMessage
    });
    
    // Extract metadata from conversation
    updateSessionMetadata(session, userMessage, aiMessage);
    
    return aiMessage;
    
  } catch (error) {
    logCall(callId, 'AI_RESPONSE_ERROR', {
      error: error.message,
      response: error.response?.data
    });
    
    // Fallback response
    return "معذرت، مجھے کچھ مسئلہ ہو رہا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
  }
}

// Update session metadata based on conversation
function updateSessionMetadata(session, userMessage, aiMessage) {
  const lowerUser = userMessage.toLowerCase();
  const lowerAI = aiMessage.toLowerCase();
  
  // Detect language
  if (!session.metadata.language) {
    if (/[\u0600-\u06FF]/.test(userMessage)) {
      session.metadata.language = 'urdu';
    } else {
      session.metadata.language = 'english';
    }
  }
  
  // Detect intent
  if (!session.metadata.intent) {
    if (lowerUser.includes('balance') || lowerUser.includes('بیلنس')) {
      session.metadata.intent = 'balance';
    } else if (lowerUser.includes('statement') || lowerUser.includes('سٹیٹمنٹ')) {
      session.metadata.intent = 'statement';
    } else if (lowerUser.includes('branch') || lowerUser.includes('برانچ')) {
      session.metadata.intent = 'branch';
    } else if (lowerUser.includes('loan') || lowerUser.includes('قرض')) {
      session.metadata.intent = 'loan';
    } else if (lowerUser.includes('complaint') || lowerUser.includes('شکایت')) {
      session.metadata.intent = 'complaint';
    }
  }
  
  // Detect if verification is being requested
  if (lowerAI.includes('verification') || lowerAI.includes('shanakht') || lowerAI.includes('maloomat')) {
    session.metadata.verificationRequired = true;
  }
}

// Record and transcribe customer speech
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

// Play message
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

log('SUCCESS', 'Conversational IVR started', {
  app_name: process.env.ASTERISK_APP_NAME,
  mode: 'AI-Powered Conversational'
});
log('INFO', 'Waiting for incoming calls...');
