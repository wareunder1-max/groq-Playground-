# Asterisk AI Call Handler - Troubleshooting Guide

## Current Status (March 10, 2026)

### What's Working ✅
- Asterisk ARI connection (127.0.0.1:8086)
- Call answering on extension 9995
- ElevenLabs TTS generation
- Groq Whisper API configured
- Groq LLaMA API configured
- Comprehensive logging system

### What Needs Testing 🔧
- **Recording user speech** - Fixed to use ari-client library with proper event handling
- **TTS file playback** - Fixed to use /tmp/asterisk-audio/ with absolute paths

## Recent Fixes (March 10, 2026)

### 1. Recording Fix
**Problem**: Asterisk returned "Internal Server Error: No such file or directory"

**Root Cause**: 
- Using direct HTTP POST bypassed proper ARI event handling
- Recording path wasn't being handled correctly by Asterisk

**Solution**:
- Switched back to ari-client library's `channel.record()` method
- Use simple filename (e.g., `ai_recording_1234567890`) without path
- Asterisk automatically saves to `/var/spool/asterisk/monitor/`
- Properly handle `RecordingFinished` and `RecordingFailed` events
- Wait for events instead of arbitrary timeout

### 2. TTS Playback Fix
**Problem**: Asterisk couldn't find MP3 files

**Root Causes**:
- Files were being saved to `/var/lib/asterisk/sounds/custom/` (read-only)
- Path format wasn't correct for Asterisk playback

**Solution**:
- Changed audio directory to `/tmp/asterisk-audio/` (writable)
- Use absolute file paths: `sound:/tmp/asterisk-audio/filename` (without .mp3 extension)
- Asterisk automatically adds the extension when looking for files

## Testing Steps

### 1. Restart the Server
```bash
cd /opt/ai-call-handler
pm2 restart ai-call-handler
# or
node server.js
```

### 2. Make a Test Call
- Dial extension 9995 from any phone
- Listen for greeting
- Speak after the greeting
- Wait for AI response

### 3. Check Logs
```bash
# Real-time logs
tail -f /var/log/inbound-call-handler/call-handler-2026-03-10.log

# Call-specific logs
ls /var/log/inbound-call-handler/call-*.log
tail -f /var/log/inbound-call-handler/call-<channel-id>.log
```

### 4. Verify Recording Files
```bash
# Check if recordings are being created
ls -lh /var/spool/asterisk/monitor/

# Check latest recording
ls -lht /var/spool/asterisk/monitor/ | head -5
```

### 5. Verify TTS Files
```bash
# Check if TTS files are being created
ls -lh /tmp/asterisk-audio/

# Files should be created and deleted after playback
# If files remain, playback might have failed
```

## Common Issues

### Issue: Recording still fails
**Check**:
1. Asterisk user has write permissions to `/var/spool/asterisk/monitor/`
   ```bash
   sudo chown -R asterisk:asterisk /var/spool/asterisk/monitor/
   sudo chmod 775 /var/spool/asterisk/monitor/
   ```

2. Check Asterisk logs for specific errors:
   ```bash
   asterisk -rx "core show channels"
   tail -f /var/log/asterisk/full
   ```

### Issue: TTS playback fails
**Check**:
1. Directory exists and is writable:
   ```bash
   ls -ld /tmp/asterisk-audio/
   sudo chmod 777 /tmp/asterisk-audio/
   ```

2. Check if MP3 files are being created:
   ```bash
   ls -lh /tmp/asterisk-audio/
   ```

3. Check Asterisk can access the files:
   ```bash
   sudo -u asterisk ls /tmp/asterisk-audio/
   ```

### Issue: No audio in either direction
**Check**:
1. Channel is answered:
   ```bash
   asterisk -rx "core show channels"
   ```

2. Check ARI connection:
   ```bash
   asterisk -rx "ari show apps"
   ```

## Environment Variables

Required in `.env`:
```
ASTERISK_HOST=127.0.0.1
ASTERISK_PORT=8086
ASTERISK_USERNAME=asterisk
ASTERISK_PASSWORD=your_password
ASTERISK_APP_NAME=ai-call-handler

GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

## Debug Mode

To enable verbose logging:
1. Check Node.js console output
2. Check call-specific logs in `/var/log/inbound-call-handler/`
3. Enable Asterisk ARI debug:
   ```bash
   asterisk -rx "ari set debug all on"
   ```

## Next Steps After Testing

Once recording and playback work:
1. Test full conversation flow (greeting → record → transcribe → AI → TTS → playback)
2. Test "goodbye" exit command
3. Test multiple concurrent calls
4. Optimize timing parameters (silence detection, max duration, etc.)
5. Add error recovery and retry logic
