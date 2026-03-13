# Pre-Recorded Prompts System

## Concept

Since the IVR has a **limited scope** with predefined services, we can pre-record all common responses and only use ElevenLabs TTS for dynamic content (numbers, names, etc.).

## Benefits

### 1. Cost Savings 💰
- **Current**: Every response = ElevenLabs API call (~$0.003 each)
- **With Pre-recorded**: 90% of responses = FREE
- **Savings**: ~$0.0027 per call

### 2. Faster Response ⚡
- **Current**: TTS generation = 1-2 seconds
- **With Pre-recorded**: Instant playback = 0 seconds
- **Improvement**: 1-2 seconds faster per turn

### 3. Consistent Quality 🎵
- Same voice, tone, and quality every time
- No variations in pronunciation
- Professional sound

### 4. Offline Capability 📴
- Works even if ElevenLabs is down
- No internet dependency for common prompts
- More reliable system

---

## Pre-Recorded Prompts List

### Category 1: Greetings & Welcome

```
PROMPT_001: "صبح بخیر! آپ کی کالر آئی ڈی {DYNAMIC} کے مطابق، آپ ہمارے کسٹمر ہیں۔ بتائیں، میں آپ کی کیا خدمت کروں؟"
            (Good morning! According to your caller ID {DYNAMIC}, you are our customer. How can I help you?)
            
PROMPT_002: "شام بخیر! بتائیں، میں آپ کی کیا خدمت کروں؟"
            (Good evening! How can I help you?)
```

### Category 2: TPIN Verification

```
PROMPT_010: "بیلنس بتانے سے پہلے، براہ کرم اپنا TPIN بتائیں یا فون سے انٹر کریں۔"
            (Before telling balance, please tell your TPIN or enter from phone.)
            
PROMPT_011: "شکریہ، آپ کا TPIN چیک کر رہا ہوں۔"
            (Thank you, checking your TPIN.)
            
PROMPT_012: "شکریہ، آپ کا TPIN درست ہے۔"
            (Thank you, your TPIN is correct.)
            
PROMPT_013: "معذرت، یہ TPIN ٹھیک نہیں ہے۔ کیا آپ دوبارہ کوشش کریں گے؟"
            (Sorry, this TPIN is not correct. Would you like to try again?)
            
PROMPT_014: "ٹھیک ہے، براہ کرم اپنا TPIN دوبارہ بتائیں۔"
            (Okay, please tell your TPIN again.)
            
PROMPT_015: "معذرت، TPIN دوبارہ غلط ہے۔ کیا میں آپ کی کوئی اور مدد کر سکتا ہوں؟"
            (Sorry, TPIN is wrong again. Can I help you with anything else?)
```

### Category 3: Balance Inquiry

```
PROMPT_020: "آپ کا موجودہ بیلنس {DYNAMIC} روپے ہے۔"
            (Your current balance is {DYNAMIC} rupees.)
            
PROMPT_021: "کیا کوئی اور مدد چاہیے؟"
            (Do you need any other help?)
```

### Category 4: Account Statement

```
PROMPT_030: "آپ کی آخری تین لین دین:"
            (Your last three transactions:)
            
PROMPT_031: "{DYNAMIC} مارچ کو ATM سے {DYNAMIC} روپے نکالے۔"
            ({DYNAMIC} March, ATM withdrawal {DYNAMIC} rupees.)
            
PROMPT_032: "{DYNAMIC} مارچ کو آن لائن {DYNAMIC} روپے ٹرانسفر کیے۔"
            ({DYNAMIC} March, online transfer {DYNAMIC} rupees.)
            
PROMPT_033: "{DYNAMIC} مارچ کو {DYNAMIC} روپے تنخواہ جمع ہوئی۔"
            ({DYNAMIC} March, salary deposit {DYNAMIC} rupees.)
```

### Category 5: Branch Locator

```
PROMPT_040: "ضرور۔ آپ کس شہر میں برانچ تلاش کر رہے ہیں؟"
            (Sure. In which city are you looking for a branch?)
            
PROMPT_041: "لاہور میں ہماری تین برانچیں ہیں: گلبرگ، ڈیفنس، اور جوہر ٹاؤن۔ کون سی چاہیے؟"
            (We have three branches in Lahore: Gulberg, Defence, and Johar Town. Which one?)
            
PROMPT_042: "کراچی میں ہماری دو برانچیں ہیں: کلفٹن اور گلشن۔ کون سی چاہیے؟"
            (We have two branches in Karachi: Clifton and Gulshan. Which one?)
            
PROMPT_043: "گلبرگ برانچ کا پتہ ہے: مین بلیوارڈ، گلبرگ 3، لاہور۔ فون نمبر: 042-35714000۔"
            (Gulberg branch address: Main Boulevard, Gulberg 3, Lahore. Phone: 042-35714000.)
```

### Category 6: Loan Information

```
PROMPT_050: "کون سا قرض چاہیے؟ پرسنل، ہوم، یا کار لون؟"
            (Which loan? Personal, home, or car loan?)
            
PROMPT_051: "پرسنل لون کی شرح سود 12 فیصد ہے، 5 سال تک کے لیے۔"
            (Personal loan interest rate is 12%, up to 5 years.)
            
PROMPT_052: "ہوم لون کی شرح سود 10 فیصد ہے، 20 سال تک کے لیے۔"
            (Home loan interest rate is 10%, up to 20 years.)
            
PROMPT_053: "کار لون کی شرح سود 14 فیصد ہے، 7 سال تک کے لیے۔"
            (Car loan interest rate is 14%, up to 7 years.)
```

### Category 7: Complaint Registration

```
PROMPT_060: "ضرور، آپ کی شکایت کیا ہے؟"
            (Sure, what is your complaint?)
            
PROMPT_061: "آپ کی شکایت درج کر لی گئی ہے۔ آپ کا ریفرنس نمبر {DYNAMIC} ہے۔"
            (Your complaint has been registered. Your reference number is {DYNAMIC}.)
            
PROMPT_062: "ہم 24 سے 48 گھنٹوں میں آپ سے رابطہ کریں گے۔"
            (We will contact you within 24 to 48 hours.)
```

### Category 8: Error Handling

```
PROMPT_070: "معذرت، میں نے آپ کی آواز نہیں سنی۔ براہ کرم دوبارہ بولیں۔"
            (Sorry, I didn't hear you. Please speak again.)
            
PROMPT_071: "معذرت، میں سمجھ نہیں سکا۔ براہ کرم دوبارہ بتائیں۔"
            (Sorry, I didn't understand. Please tell again.)
            
PROMPT_072: "معذرت، یہ سروس فی الوقت دستیاب نہیں ہے۔"
            (Sorry, this service is not currently available.)
            
PROMPT_073: "معذرت، کچھ تکنیکی مسئلہ ہو رہا ہے۔ براہ کرم بعد میں کوشش کریں۔"
            (Sorry, there is a technical problem. Please try later.)
```

### Category 9: Goodbye

```
PROMPT_080: "شکریہ۔ اللہ حافظ۔"
            (Thank you. Goodbye.)
            
PROMPT_081: "شکریہ۔ اگر مزید مدد چاہیے تو دوبارہ کال کریں۔ اللہ حافظ۔"
            (Thank you. If you need more help, call again. Goodbye.)
            
PROMPT_082: "کوئی بات نہیں۔ میں آپ کی کوئی اور مدد کر سکتا ہوں؟"
            (No problem. Can I help you with anything else?)
```

### Category 10: Confirmation

```
PROMPT_090: "جی ہاں"
            (Yes)
            
PROMPT_091: "ٹھیک ہے"
            (Okay)
            
PROMPT_092: "شکریہ"
            (Thank you)
```

---

## Dynamic Content (Still Use TTS)

### When to Use ElevenLabs:

1. **Numbers**: Balance amounts, phone numbers, reference numbers
2. **Dates**: Transaction dates, account opening dates
3. **Names**: Customer names, branch names (if dynamic)
4. **Transcribed Speech**: When repeating what customer said
5. **AI-Generated Responses**: For out-of-scope or complex queries

### Example Hybrid Response:

```
[PRERECORDED] "آپ کا موجودہ بیلنس"
[TTS] "پچاس ہزار" (50,000)
[PRERECORDED] "روپے ہے۔ کیا کوئی اور مدد چاہیے؟"
```

---

## File Structure

```
/var/lib/asterisk/sounds/ivr/
├── urdu/
│   ├── greeting/
│   │   ├── prompt_001.wav
│   │   └── prompt_002.wav
│   ├── tpin/
│   │   ├── prompt_010.wav
│   │   ├── prompt_011.wav
│   │   └── ...
│   ├── balance/
│   │   ├── prompt_020.wav
│   │   └── prompt_021.wav
│   ├── statement/
│   │   └── ...
│   ├── branch/
│   │   └── ...
│   ├── loan/
│   │   └── ...
│   ├── complaint/
│   │   └── ...
│   ├── error/
│   │   └── ...
│   └── goodbye/
│       └── ...
└── english/
    └── (same structure)
```

---

## Implementation

### Prompt Manager Class

```javascript
const fs = require('fs');
const path = require('path');

class PromptManager {
  constructor(baseDir = '/var/lib/asterisk/sounds/ivr') {
    this.baseDir = baseDir;
    this.cache = new Map();
  }
  
  getPromptPath(promptId, language = 'urdu') {
    // Map prompt ID to file path
    const category = this.getCategoryFromId(promptId);
    return path.join(this.baseDir, language, category, `prompt_${promptId}.wav`);
  }
  
  getCategoryFromId(promptId) {
    const id = parseInt(promptId);
    if (id >= 1 && id < 10) return 'greeting';
    if (id >= 10 && id < 20) return 'tpin';
    if (id >= 20 && id < 30) return 'balance';
    if (id >= 30 && id < 40) return 'statement';
    if (id >= 40 && id < 50) return 'branch';
    if (id >= 50 && id < 60) return 'loan';
    if (id >= 60 && id < 70) return 'complaint';
    if (id >= 70 && id < 80) return 'error';
    if (id >= 80 && id < 90) return 'goodbye';
    if (id >= 90 && id < 100) return 'confirmation';
    return 'misc';
  }
  
  async playPrompt(ari, channel, promptId, language = 'urdu') {
    const promptPath = this.getPromptPath(promptId, language);
    
    if (!fs.existsSync(promptPath)) {
      console.error(`Prompt not found: ${promptPath}`);
      return false;
    }
    
    // Remove extension for Asterisk
    const soundPath = promptPath.replace('.wav', '');
    
    const playback = ari.Playback();
    await channel.play({ media: `sound:${soundPath}` }, playback);
    
    await new Promise((resolve) => {
      playback.on('PlaybackFinished', resolve);
    });
    
    return true;
  }
  
  async playHybridResponse(ari, channel, parts, language = 'urdu') {
    // parts = [
    //   { type: 'prompt', id: '020' },
    //   { type: 'tts', text: 'پچاس ہزار' },
    //   { type: 'prompt', id: '021' }
    // ]
    
    for (const part of parts) {
      if (part.type === 'prompt') {
        await this.playPrompt(ari, channel, part.id, language);
      } else if (part.type === 'tts') {
        await this.playTTS(ari, channel, part.text);
      }
    }
  }
  
  async playTTS(ari, channel, text) {
    // Generate TTS only for dynamic content
    const audioFile = await textToSpeech(text);
    const filePath = path.join('/tmp/asterisk-audio', audioFile);
    const filePathWithoutExt = filePath.replace('.mp3', '');
    
    const playback = ari.Playback();
    await channel.play({ media: `sound:${filePathWithoutExt}` }, playback);
    
    await new Promise((resolve) => {
      playback.on('PlaybackFinished', resolve);
    });
    
    fs.unlinkSync(filePath);
  }
}

// Usage
const promptManager = new PromptManager();

// Play greeting
await promptManager.playPrompt(ari, channel, '001', 'urdu');

// Play balance with dynamic amount
await promptManager.playHybridResponse(ari, channel, [
  { type: 'prompt', id: '020' }, // "آپ کا موجودہ بیلنس"
  { type: 'tts', text: 'پچاس ہزار' }, // Dynamic amount
  { type: 'prompt', id: '021' } // "روپے ہے۔ کیا کوئی اور مدد چاہیے؟"
], 'urdu');
```

---

## Generating Pre-Recorded Prompts

### Option 1: Use ElevenLabs Once

```javascript
const axios = require('axios');
const fs = require('fs');

async function generateAllPrompts() {
  const prompts = {
    '001': 'صبح بخیر! بتائیں، میں آپ کی کیا خدمت کروں؟',
    '010': 'بیلنس بتانے سے پہلے، براہ کرم اپنا TPIN بتائیں۔',
    '011': 'شکریہ، آپ کا TPIN چیک کر رہا ہوں۔',
    // ... all prompts
  };
  
  for (const [id, text] of Object.entries(prompts)) {
    console.log(`Generating prompt ${id}...`);
    
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
    
    // Save as WAV (convert from MP3 if needed)
    const outputPath = `/var/lib/asterisk/sounds/ivr/urdu/prompt_${id}.wav`;
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    
    console.log(`Saved: ${outputPath}`);
  }
}

generateAllPrompts();
```

### Option 2: Record Manually

Use a professional voice artist to record all prompts in a studio for best quality.

---

## Cost Analysis

### Current System (All TTS):
```
Average call: 8 responses × $0.003 = $0.024 per call
1000 calls/month = $24/month
```

### Hybrid System (90% Pre-recorded):
```
Average call: 1 dynamic response × $0.003 = $0.003 per call
1000 calls/month = $3/month
One-time: Generate 100 prompts × $0.003 = $0.30
```

### Savings:
```
Monthly: $24 - $3 = $21 saved (87.5% reduction!)
Annual: $252 saved
```

---

## Best Practices

1. **Keep Prompts Modular**: Small, reusable chunks
2. **Use Consistent Voice**: Same voice for all prompts
3. **Version Control**: Track prompt changes
4. **Quality Check**: Listen to all prompts before deployment
5. **Fallback to TTS**: If prompt missing, generate on-the-fly
6. **Cache Management**: Pre-load frequently used prompts
7. **A/B Testing**: Test pre-recorded vs TTS quality

---

## Conclusion

Pre-recorded prompts are **perfect** for your limited-scope IVR:

✅ **90% cost reduction**
✅ **Faster responses** (1-2 seconds saved per turn)
✅ **Consistent quality**
✅ **More reliable** (no API dependency)
✅ **Professional sound**

Only use TTS for:
- Numbers (balance, amounts, dates)
- Dynamic content (names, references)
- Out-of-scope responses

This is the **industry standard** approach used by all major banks and telecom companies!
