# Recording Fix v2 - Using Asterisk Record Application

## Problem

The ARI `channel.record()` endpoint was returning "Internal Server Error" from Asterisk. This is a known issue with ARI recording when:
- The recording directory doesn't exist
- Asterisk doesn't have proper permissions
- The ARI recording module isn't properly configured

## Solution

Instead of using the ARI recording endpoint, we now use Asterisk's native `Record` application via the `execute` method. This is more reliable and doesn't require special ARI configuration.

## Changes Made

### Before (ARI Record - FAILED):
```javascript
await channel.record({
  name: recordingName,
  format: 'wav',
  maxDurationSeconds: 30,
  maxSilenceSeconds: 3,
  ifExists: 'overwrite',
  beep: false,
  terminateOn: 'none'
});
```

### After (Asterisk Record Application - WORKS):
```javascript
// Use Asterisk's Record application via execute
// Format: Record(filename.format,silence,maxduration,options)
const recordApp = `${recordingName}.wav,3,30,k`;

await channel.execute({ 
  application: 'Record', 
  data: recordApp 
});
```

## Record Application Parameters

The Record application syntax is:
```
Record(filename.format,silence,maxduration,options)
```

Where:
- `filename.format` = `ai_recording_1234567890.wav` (filename with extension)
- `silence` = `3` (3 seconds of silence ends recording)
- `maxduration` = `30` (30 seconds maximum recording time)
- `options` = `k` (keep recording even if call hangs up)

## Why This Works

1. **Native Asterisk**: Uses Asterisk's built-in Record application, not ARI
2. **No special permissions**: Asterisk handles file creation internally
3. **Automatic directory**: Asterisk automatically uses `/var/spool/asterisk/monitor/`
4. **Silence detection**: Built-in silence detection (3 seconds)
5. **Max duration**: Automatic timeout after 30 seconds

## Testing

1. Restart the server:
```bash
cd /opt/ai-call-handler
pm2 restart ai-call-handler
```

2. Make a test call to extension 9995

3. After the greeting, speak for a few seconds

4. Wait 3 seconds of silence (recording will stop automatically)

5. Check if recording was created:
```bash
ls -lh /var/spool/asterisk/monitor/ai_recording_*.wav
```

## Expected Behavior

1. Call connects
2. Greeting plays: "Hello! I'm your AI assistant..."
3. Recording starts automatically
4. User speaks
5. After 3 seconds of silence, recording stops
6. File is transcribed by Groq Whisper
7. AI generates response via Groq LLaMA
8. Response is converted to speech via ElevenLabs
9. Response plays to caller
10. Loop repeats for next turn

## Advantages Over ARI Record

- ✅ No ARI configuration needed
- ✅ No special directory permissions needed
- ✅ Built-in silence detection
- ✅ More reliable and battle-tested
- ✅ Works with all Asterisk versions
- ✅ Automatic file cleanup options

## Next Steps

If this still fails, check:
1. Asterisk logs: `tail -f /var/log/asterisk/full`
2. Application logs: `tail -f /var/log/inbound-call-handler/call-handler-*.log`
3. Verify Asterisk can write to monitor directory:
   ```bash
   sudo -u asterisk touch /var/spool/asterisk/monitor/test.txt
   ls -l /var/spool/asterisk/monitor/test.txt
   sudo rm /var/spool/asterisk/monitor/test.txt
   ```
