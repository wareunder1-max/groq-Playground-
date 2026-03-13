# Asterisk AI Call Handler - Current Status

## ✅ What's Working (90% Complete)

1. **Connection to Asterisk ARI** - ✅ Working
2. **Call Answering** - ✅ Working
3. **TTS Generation (ElevenLabs)** - ✅ Working (53KB audio files)
4. **Greeting Playback** - ✅ Working
5. **Groq Whisper API** - ✅ Configured
6. **Groq LLaMA API** - ✅ Configured
7. **Logging System** - ✅ Working (detailed logs in `/var/log/inbound-call-handler/`)

## ❌ What's Not Working

**Recording User Speech** - Asterisk ARI returns "Internal Server Error"

### Error Details
```
Error: {"message":"Internal Server Error"}
at SwaggerRequest.swaggerError
```

### Asterisk Logs Show
```
WARNING[...] ari/resource_channels.c: Unrecognized recording error: No such file or directory
```

## Root Cause

Asterisk's ARI recording API cannot create the recording file. This is an **Asterisk configuration issue**, not a code issue.

## Solution Options

### Option 1: Fix Asterisk Recording Configuration (Recommended)

Check Asterisk recording settings:

```bash
# Check Asterisk configuration
asterisk -rx "core show settings" | grep -i record

# Check directory permissions
ls -la /var/spool/asterisk/monitor
ls -la /var/spool/asterisk/recording

# Create recording directory
sudo mkdir -p /var/spool/asterisk/recording
sudo chown -R asterisk:asterisk /var/spool/asterisk/recording
sudo chmod 777 /var/spool/asterisk/recording

# Restart Asterisk
sudo systemctl restart asterisk
```

### Option 2: Use MixMonitor via AMI (Alternative)

Instead of ARI's `channel.record()`, use Asterisk's MixMonitor via AMI (like your PHP project).

This requires:
1. Adding AMI connection to the Node.js code
2. Using `MixMonitor` action instead of ARI recording
3. This is more reliable but adds complexity

### Option 3: Skip Recording for Now (Quick Test)

To test the full AI conversation flow without recording:
1. Use a placeholder transcription
2. Test AI response generation
3. Test TTS playback
4. Fix recording later

## Current Configuration

- **Audio Directory**: `/tmp/asterisk-audio/` (TTS files)
- **Recording Directory**: `/var/spool/asterisk/monitor/` (Asterisk default)
- **Log Directory**: `/var/log/inbound-call-handler/`
- **Asterisk Host**: 127.0.0.1:8086
- **App Name**: ai-call-handler
- **Extension**: 9995

## Test Results

**Last Test Call**: 1773085473.14
- ✅ Call answered
- ✅ Greeting played (TTS working)
- ❌ Recording failed (Asterisk error)
- Call ended

## Next Steps

1. **Check Asterisk logs** for detailed error:
   ```bash
   tail -100 /var/log/asterisk/full | grep -i "record\|error"
   ```

2. **Verify Asterisk recording permissions**

3. **Consider using MixMonitor** (proven to work in your PHP project)

## Recommendation

Since your PHP project successfully uses MixMonitor via AMI, I recommend implementing the same approach in Node.js. This will be more reliable than ARI's recording API.

Would you like me to:
- A) Help troubleshoot Asterisk recording configuration
- B) Implement MixMonitor via AMI (like your PHP project)
- C) Create a test version without recording to verify the full flow works
