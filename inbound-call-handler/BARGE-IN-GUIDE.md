# Barge-In Implementation Guide

## What is Barge-In?

Barge-in allows customers to interrupt the IVR by speaking, making the experience more natural and human-like.

## Implementation Options

### Option 1: DTMF-Based Barge-In (Easiest)

Customer presses any key to interrupt playback.

**Pros:**
- Simple to implement
- Works reliably
- No special Asterisk configuration

**Cons:**
- Requires customer to press a key
- Less natural than voice-based

**Implementation:**

```javascript
async function playMessageWithDTMFBargeIn(ari, channel, message, callId) {
  const audioFile = await textToSpeech(message, callId);
  const filePath = path.join(AUDIO_DIR, audioFile);
  const filePathWithoutExt = filePath.replace('.mp3', '');
  
  const playback = ari.Playback();
  
  // Listen for DTMF
  const bargeInPromise = new Promise((resolve) => {
    const dtmfHandler = (event) => {
      if (event.channel.id === channel.id) {
        // Stop playback on any DTMF
        playback.stop();
        ari.removeListener('ChannelDtmfReceived', dtmfHandler);
        resolve('barged_in');
      }
    };
    ari.on('ChannelDtmfReceived', dtmfHandler);
  });
  
  // Start playback
  await channel.play({ media: `sound:${filePathWithoutExt}` }, playback);
  
  // Wait for either playback to finish or DTMF
  await Promise.race([
    new Promise((resolve) => playback.on('PlaybackFinished', () => resolve('completed'))),
    bargeInPromise
  ]);
  
  fs.unlinkSync(filePath);
}
```

### Option 2: Voice Activity Detection (VAD) - Most Natural

Detect when customer starts speaking and stop playback automatically.

**Pros:**
- Most natural experience
- No customer action required
- True conversational feel

**Cons:**
- Requires Asterisk talk detection
- More complex implementation
- May have false positives

**Implementation:**

```javascript
async function playMessageWithVoiceBargeIn(ari, channel, message, callId) {
  const audioFile = await textToSpeech(message, callId);
  const filePath = path.join(AUDIO_DIR, audioFile);
  const filePathWithoutExt = filePath.replace('.mp3', '');
  
  // Enable talk detection on channel
  await axios.post(
    `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/channels/${channel.id}/variable`,
    {
      variable: 'TALK_DETECT(set)',
      value: '2500' // 2.5 seconds of speech triggers event
    },
    {
      auth: {
        username: process.env.ASTERISK_USERNAME,
        password: process.env.ASTERISK_PASSWORD
      }
    }
  );
  
  const playback = ari.Playback();
  let playbackId = null;
  
  // Listen for talking started
  const bargeInPromise = new Promise((resolve) => {
    const talkHandler = (event) => {
      if (event.channel.id === channel.id) {
        logCall(callId, 'BARGE_IN_DETECTED', { event: 'ChannelTalkingStarted' });
        
        // Stop playback immediately
        if (playbackId) {
          axios.delete(
            `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/playbacks/${playbackId}`,
            {
              auth: {
                username: process.env.ASTERISK_USERNAME,
                password: process.env.ASTERISK_PASSWORD
              }
            }
          ).catch(() => {}); // Ignore errors if already stopped
        }
        
        ari.removeListener('ChannelTalkingStarted', talkHandler);
        resolve('barged_in');
      }
    };
    ari.on('ChannelTalkingStarted', talkHandler);
  });
  
  // Start playback with deterministic ID
  playbackId = `playback_${Date.now()}`;
  await axios.post(
    `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/channels/${channel.id}/play`,
    {
      media: `sound:${filePathWithoutExt}`,
      playbackId: playbackId
    },
    {
      auth: {
        username: process.env.ASTERISK_USERNAME,
        password: process.env.ASTERISK_PASSWORD
      }
    }
  );
  
  // Wait for either playback to finish or barge-in
  const result = await Promise.race([
    new Promise((resolve) => {
      const finishHandler = (event) => {
        if (event.playback && event.playback.id === playbackId) {
          ari.removeListener('PlaybackFinished', finishHandler);
          resolve('completed');
        }
      };
      ari.on('PlaybackFinished', finishHandler);
    }),
    bargeInPromise
  ]);
  
  logCall(callId, 'PLAYBACK_RESULT', { result });
  
  fs.unlinkSync(filePath);
  
  return result; // 'completed' or 'barged_in'
}
```

### Option 3: Hybrid Approach (Recommended)

Combine both DTMF and voice detection for maximum flexibility.

```javascript
async function playMessageWithBargeIn(ari, channel, message, callId) {
  const audioFile = await textToSpeech(message, callId);
  const filePath = path.join(AUDIO_DIR, audioFile);
  const filePathWithoutExt = filePath.replace('.mp3', '');
  
  // Enable talk detection
  await axios.post(
    `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/channels/${channel.id}/variable`,
    {
      variable: 'TALK_DETECT(set)',
      value: '2000' // 2 seconds
    },
    {
      auth: {
        username: process.env.ASTERISK_USERNAME,
        password: process.env.ASTERISK_PASSWORD
      }
    }
  );
  
  const playbackId = `playback_${Date.now()}`;
  
  // Create barge-in listeners
  const bargeInPromise = new Promise((resolve) => {
    // Voice barge-in
    const talkHandler = (event) => {
      if (event.channel.id === channel.id) {
        cleanup();
        resolve({ type: 'voice', event });
      }
    };
    
    // DTMF barge-in
    const dtmfHandler = (event) => {
      if (event.channel.id === channel.id) {
        cleanup();
        resolve({ type: 'dtmf', digit: event.digit });
      }
    };
    
    const cleanup = () => {
      ari.removeListener('ChannelTalkingStarted', talkHandler);
      ari.removeListener('ChannelDtmfReceived', dtmfHandler);
      
      // Stop playback
      axios.delete(
        `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/playbacks/${playbackId}`,
        {
          auth: {
            username: process.env.ASTERISK_USERNAME,
            password: process.env.ASTERISK_PASSWORD
          }
        }
      ).catch(() => {});
    };
    
    ari.on('ChannelTalkingStarted', talkHandler);
    ari.on('ChannelDtmfReceived', dtmfHandler);
  });
  
  // Start playback
  await axios.post(
    `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}/ari/channels/${channel.id}/play`,
    {
      media: `sound:${filePathWithoutExt}`,
      playbackId: playbackId
    },
    {
      auth: {
        username: process.env.ASTERISK_USERNAME,
        password: process.env.ASTERISK_PASSWORD
      }
    }
  );
  
  // Wait for completion or barge-in
  const result = await Promise.race([
    new Promise((resolve) => {
      const finishHandler = (event) => {
        if (event.playback && event.playback.id === playbackId) {
          ari.removeListener('PlaybackFinished', finishHandler);
          resolve({ type: 'completed' });
        }
      };
      ari.on('PlaybackFinished', finishHandler);
    }),
    bargeInPromise
  ]);
  
  logCall(callId, 'PLAYBACK_RESULT', result);
  
  fs.unlinkSync(filePath);
  
  return result;
}
```

## Usage in IVR Flow

```javascript
async function handleIVRFlow(ari, channel, session) {
  const callId = session.id;
  
  // Play greeting with barge-in
  const greetingResult = await playMessageWithBargeIn(
    ari, 
    channel, 
    IVR_CONFIG.greetings.initial, 
    callId
  );
  
  if (greetingResult.type === 'voice' || greetingResult.type === 'dtmf') {
    logCall(callId, 'CUSTOMER_INTERRUPTED_GREETING', greetingResult);
    // Customer is ready to speak, start recording immediately
  }
  
  // Continue with language detection...
  const languageResponse = await recordAndTranscribe(ari, channel, callId, 10, 2);
  // ...
}
```

## Testing Barge-In

### Test Voice Barge-In:
1. Call the IVR
2. Start speaking while greeting is playing
3. Greeting should stop immediately
4. Your speech should be recorded

### Test DTMF Barge-In:
1. Call the IVR
2. Press any key while greeting is playing
3. Greeting should stop
4. System should wait for your speech

## Asterisk Configuration

For voice activity detection, ensure Asterisk has talk detection enabled:

```ini
; /etc/asterisk/ari.conf
[general]
enabled = yes
pretty = yes

; /etc/asterisk/modules.conf
[modules]
autoload = yes
preload => func_talkdetect.so
```

## Performance Considerations

### Voice Detection Sensitivity

Adjust the talk detection threshold:

```javascript
// More sensitive (detects quieter speech)
value: '1500' // 1.5 seconds

// Less sensitive (requires louder/longer speech)
value: '3000' // 3 seconds
```

### False Positive Prevention

Add a minimum speech duration:

```javascript
let speechStartTime = null;
const MIN_SPEECH_DURATION = 500; // 500ms

const talkHandler = (event) => {
  if (!speechStartTime) {
    speechStartTime = Date.now();
    
    // Wait for minimum duration
    setTimeout(() => {
      if (speechStartTime) {
        // Speech continued for minimum duration, trigger barge-in
        stopPlayback();
      }
    }, MIN_SPEECH_DURATION);
  }
};
```

## Troubleshooting

### Issue: Barge-in too sensitive
**Solution**: Increase `TALK_DETECT` value or add minimum duration check

### Issue: Barge-in not working
**Solution**: Check Asterisk logs for talk detection events:
```bash
asterisk -rx "core set verbose 5"
```

### Issue: Playback not stopping
**Solution**: Verify playbackId is correct and use direct HTTP DELETE

## Best Practices

1. **Always provide feedback**: Let customer know you heard them
2. **Handle partial playback**: Resume from where interrupted if needed
3. **Log barge-in events**: Track how often customers interrupt
4. **Test with real users**: Adjust sensitivity based on feedback
5. **Provide DTMF fallback**: Not all customers will speak immediately

## Next Steps

1. Implement Option 1 (DTMF) first for quick wins
2. Test with users and gather feedback
3. Add Option 2 (Voice) for better UX
4. Monitor false positive rate
5. Fine-tune detection parameters
6. Consider Option 3 (Hybrid) for production
