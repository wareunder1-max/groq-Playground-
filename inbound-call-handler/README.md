# Asterisk AI Call Handler

AI-powered phone call handler for Asterisk PBX using Groq (STT + AI) and ElevenLabs (TTS).

## Features

- 📞 Handles inbound calls via Asterisk ARI
- 🎙️ Speech-to-Text using Groq Whisper
- 🤖 AI conversation using Groq LLaMA
- 🔊 Text-to-Speech using ElevenLabs
- 💬 Session-based conversations (each call is separate)
- ⚡ Real-time call handling

## Prerequisites

- Asterisk 13+ with ARI enabled
- Node.js 16+
- Groq API key
- ElevenLabs API key

## Setup

### 1. Configure Asterisk

#### Enable ARI
Edit `/etc/asterisk/ari.conf`:
```ini
[general]
enabled = yes
pretty = yes

[asterisk]
type = user
read_only = no
password = asterisk
```

#### Configure Dialplan
Add to `/etc/asterisk/extensions.conf`:
```ini
[from-external]
exten => _X.,1,NoOp(Incoming call from ${CALLERID(num)})
 same => n,Answer()
 same => n,Stasis(ai-call-handler)
 same => n,Hangup()

[from-internal]
exten => 1000,1,NoOp(Test AI Call Handler)
 same => n,Answer()
 same => n,Stasis(ai-call-handler)
 same => n,Hangup()
```

#### Reload Asterisk
```bash
asterisk -rx "module reload res_ari.so"
asterisk -rx "dialplan reload"
```

### 2. Install Node.js Dependencies

```bash
cd inbound-call-handler
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
ASTERISK_HOST=localhost
ASTERISK_PORT=8088
ASTERISK_USERNAME=asterisk
ASTERISK_PASSWORD=asterisk
ASTERISK_APP_NAME=ai-call-handler

GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

### 4. Run the Handler

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## How It Works

1. **Incoming Call** → Asterisk routes to Stasis app
2. **Answer Call** → Call is answered automatically
3. **Play Greeting** → AI introduces itself
4. **Record Speech** → User speaks (max 30s, 3s silence detection)
5. **Speech-to-Text** → Audio sent to Groq Whisper
6. **AI Processing** → Transcription sent to Groq LLaMA
7. **Text-to-Speech** → AI response converted by ElevenLabs
8. **Play Response** → Audio played back to caller
9. **Loop** → Repeat until user says "goodbye"
10. **Hangup** → Call ends, session cleaned up

## Testing

### Test from Internal Extension
Dial `1000` from any internal extension.

### Test from External Number
Call your Asterisk server's external number.

### Check Logs
```bash
# Node.js logs
npm start

# Asterisk logs
asterisk -rvvv
```

## File Structure

```
inbound-call-handler/
├── server.js           # Main application
├── package.json        # Dependencies
├── .env.example        # Environment template
├── extensions.conf     # Asterisk dialplan
├── ari.conf           # ARI configuration
├── audio_files/       # Temporary audio storage
└── README.md          # This file
```

## Audio Files

Audio files are stored temporarily in `./audio_files/`:
- Recordings: `recording_<callid>_<timestamp>.wav`
- TTS output: `tts_<uuid>.mp3`

Files are automatically deleted after use.

## Conversation Flow

```
Caller → Asterisk → ARI → Node.js App
                              ↓
                         Groq Whisper (STT)
                              ↓
                         Groq LLaMA (AI)
                              ↓
                         ElevenLabs (TTS)
                              ↓
                         Asterisk → Caller
```

## Exit Commands

User can end the call by saying:
- "Goodbye"
- "Hang up"
- "End call"

## Troubleshooting

### ARI Connection Failed
- Check Asterisk is running: `asterisk -rx "core show version"`
- Verify ARI is enabled: `asterisk -rx "ari show status"`
- Check credentials in `.env`

### No Audio Playback
- Verify audio files are in correct format (WAV/MP3)
- Check Asterisk can access audio directory
- Ensure file permissions are correct

### Recording Not Working
- Check Asterisk recording path: `/var/spool/asterisk/recording/`
- Verify disk space
- Check file permissions

### API Errors
- Verify Groq API key is valid
- Check ElevenLabs API key and voice ID
- Monitor API rate limits

## Cost Considerations

- **Groq**: Free tier available (14,400 requests/day)
- **ElevenLabs**: ~$0.30 per 1000 characters (free tier: 10,000 chars/month)
- **Asterisk**: Free (self-hosted)

## Production Deployment

1. Use process manager (PM2):
```bash
npm install -g pm2
pm2 start server.js --name asterisk-ai-handler
pm2 save
pm2 startup
```

2. Set up logging:
```bash
pm2 logs asterisk-ai-handler
```

3. Monitor performance:
```bash
pm2 monit
```

## Security

- Keep API keys secure in `.env`
- Use firewall to restrict ARI access
- Enable Asterisk security features
- Regularly update dependencies

## License

MIT

