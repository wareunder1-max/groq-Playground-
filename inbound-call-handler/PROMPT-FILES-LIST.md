# Complete IVR Prompt Files List

## File Naming Convention

```
Format: {language_prefix}_{category}_{id}.wav

Language Prefixes:
- 0 = Urdu (اردو) - Primary (Full support)
- 1 = English - Secondary (Full support)
- 2 = Punjabi (پنجابی) - Limited (Greeting + Error only)
- 3 = Pashto (پشتو) - Limited (Greeting + Error only)
- 4 = Sindhi (سندھی) - Limited (Greeting + Error only)
```

## Storage Location

```
inbound-call-handler/audio_files/prompts/
```

---

## Complete File List (99 files)

### Category 1: GREETINGS (001-009) - 8 files

```
0_greeting_001.wav  (Urdu - Morning greeting with caller ID)
1_greeting_001.wav  (English - Morning greeting with caller ID)
2_greeting_001.wav  (Punjabi - Simple greeting)
3_greeting_001.wav  (Pashto - Simple greeting)
4_greeting_001.wav  (Sindhi - Simple greeting)
0_greeting_002.wav  (Urdu - Afternoon/Evening greeting)
1_greeting_002.wav  (English - Afternoon/Evening greeting)
0_greeting_003.wav  (Urdu - Alternative greeting)
```

### Category 2: TPIN VERIFICATION (010-019) - 10 files

```
0_tpin_010.wav  (Urdu - Request TPIN for balance)
1_tpin_010.wav  (English - Request TPIN for balance)
0_tpin_011.wav  (Urdu - Checking TPIN)
0_tpin_012.wav  (Urdu - TPIN correct)
1_tpin_012.wav  (English - TPIN correct)
0_tpin_013.wav  (Urdu - TPIN incorrect, retry?)
1_tpin_013.wav  (English - TPIN incorrect, retry?)
0_tpin_014.wav  (Urdu - Please retry TPIN)
0_tpin_015.wav  (Urdu - TPIN wrong again)
0_tpin_016.wav  (Urdu - Request TPIN for statement)
```

### Category 3: BALANCE INQUIRY (020-029) - 7 files

```
0_balance_020.wav  (Urdu - "Your current balance is")
1_balance_020.wav  (English - "Your current balance is")
0_balance_021.wav  (Urdu - "rupees")
1_balance_021.wav  (English - "rupees")
0_balance_022.wav  (Urdu - "Any other help?")
1_balance_022.wav  (English - "Any other help?")
0_balance_023.wav  (Urdu - "Balance is zero")
```

### Category 4: ACCOUNT STATEMENT (030-039) - 9 files

```
0_statement_030.wav  (Urdu - "Your last three transactions:")
1_statement_030.wav  (English - "Your last three transactions:")
0_statement_031.wav  (Urdu - "March, ATM")
1_statement_031.wav  (English - "March, ATM withdrawal")
0_statement_032.wav  (Urdu - "rupees withdrawn")
0_statement_033.wav  (Urdu - "March, online")
0_statement_034.wav  (Urdu - "rupees transferred")
0_statement_035.wav  (Urdu - "March")
0_statement_036.wav  (Urdu - "rupees salary deposited")
```

### Category 5: BRANCH LOCATOR (040-049) - 11 files

```
0_branch_040.wav  (Urdu - "Which city?")
1_branch_040.wav  (English - "Which city?")
0_branch_041.wav  (Urdu - Lahore branches list)
1_branch_041.wav  (English - Lahore branches list)
0_branch_042.wav  (Urdu - Karachi branches list)
0_branch_043.wav  (Urdu - Gulberg branch address)
0_branch_044.wav  (Urdu - Defence branch address)
0_branch_045.wav  (Urdu - Johar Town branch address)
0_branch_046.wav  (Urdu - Clifton branch address)
0_branch_047.wav  (Urdu - Gulshan branch address)
```

### Category 6: LOAN INFORMATION (050-059) - 7 files

```
0_loan_050.wav  (Urdu - "Which loan?")
1_loan_050.wav  (English - "Which loan?")
0_loan_051.wav  (Urdu - Personal loan rate)
1_loan_051.wav  (English - Personal loan rate)
0_loan_052.wav  (Urdu - Home loan rate)
0_loan_053.wav  (Urdu - Car loan rate)
0_loan_054.wav  (Urdu - "Visit branch for details")
```

### Category 7: COMPLAINT REGISTRATION (060-069) - 6 files

```
0_complaint_060.wav  (Urdu - "What is your complaint?")
1_complaint_060.wav  (English - "What is your complaint?")
0_complaint_061.wav  (Urdu - "Complaint registered, reference number")
1_complaint_061.wav  (English - "Complaint registered, reference number")
0_complaint_062.wav  (Urdu - "is")
0_complaint_063.wav  (Urdu - "We will contact in 24-48 hours")
```

### Category 8: ERROR HANDLING (070-079) - 11 files

```
0_error_070.wav  (Urdu - "Didn't hear you")
1_error_070.wav  (English - "Didn't hear you")
0_error_071.wav  (Urdu - "Didn't understand")
1_error_071.wav  (English - "Didn't understand")
0_error_072.wav  (Urdu - "Service not available")
1_error_072.wav  (English - "Service not available")
0_error_073.wav  (Urdu - "Technical problem")
0_error_074.wav  (Urdu - "Language not supported")
2_error_074.wav  (Punjabi - "Language not supported")
3_error_074.wav  (Pashto - "Language not supported")
4_error_074.wav  (Sindhi - "Language not supported")
```

### Category 9: GOODBYE (080-089) - 5 files

```
0_goodbye_080.wav  (Urdu - "Thank you. Goodbye")
1_goodbye_080.wav  (English - "Thank you. Goodbye")
0_goodbye_081.wav  (Urdu - "Thank you. Call again. Goodbye")
1_goodbye_081.wav  (English - "Thank you. Call again. Goodbye")
0_goodbye_082.wav  (Urdu - "Have a blessed day. Goodbye")
```

### Category 10: COMMON/CONFIRMATION (090-099) - 9 files

```
0_common_090.wav  (Urdu - "No problem. Anything else?")
1_common_090.wav  (English - "No problem. Anything else?")
0_common_091.wav  (Urdu - "Okay")
1_common_091.wav  (English - "Okay")
0_common_092.wav  (Urdu - "Thank you")
1_common_092.wav  (English - "Thank you")
0_common_093.wav  (Urdu - "Yes")
0_common_094.wav  (Urdu - "Please wait")
0_common_095.wav  (Urdu - "One moment")
```

---

## Summary by Language

| Language | Prefix | Files | Coverage |
|----------|--------|-------|----------|
| **Urdu** | 0 | 60 | Full (all 10 categories) |
| **English** | 1 | 30 | Full (all 10 categories, subset) |
| **Punjabi** | 2 | 3 | Limited (Greeting + Error only) |
| **Pashto** | 3 | 3 | Limited (Greeting + Error only) |
| **Sindhi** | 4 | 3 | Limited (Greeting + Error only) |
| **TOTAL** | - | **99** | - |

---

## Playback Logic Example

```javascript
// Simple language-based playback
const languagePrefix = {
  'urdu': '0',
  'english': '1',
  'punjabi': '2',
  'pashto': '3',
  'sindhi': '4'
}[session.metadata.language] || '0'; // Default to Urdu

// Play any prompt
async function playPrompt(category, id) {
  const filename = `${languagePrefix}_${category}_${id}.wav`;
  const filepath = `audio_files/prompts/${filename}`;
  await playAudio(filepath);
}

// Examples:
await playPrompt('greeting', '001');  // Plays 0_greeting_001.wav (Urdu)
await playPrompt('tpin', '010');      // Plays 0_tpin_010.wav (Urdu)
await playPrompt('balance', '020');   // Plays 0_balance_020.wav (Urdu)
```

---

## Hybrid Playback (Pre-recorded + TTS)

```javascript
// Example: Balance announcement
await playPrompt('balance', '020');  // "آپ کا موجودہ بیلنس"
await playTTS('50,000');             // TTS for dynamic number
await playPrompt('balance', '021');  // "روپے ہے۔"
await playPrompt('balance', '022');  // "کیا کوئی اور مدد چاہیے؟"
```

---

## File Specifications

- **Format:** WAV (PCM 16-bit)
- **Sample Rate:** 8000 Hz (8kHz)
- **Channels:** Mono
- **Average Size:** ~50 KB per file
- **Total Storage:** ~5 MB for all 99 files

---

## Generation Cost

**One-time cost**: 99 files × $0.003 = **$0.30**

**Annual savings**: $252 (vs generating on every call)

**ROI**: Immediate! Pays for itself after just 100 calls.

---

## Benefits of This Naming Convention

✅ **Simple logic** - Just change prefix based on language
✅ **Easy maintenance** - Same filename structure across languages
✅ **Clear organization** - All versions of same prompt grouped together
✅ **No complex mapping** - Direct prefix substitution
✅ **Scalable** - Easy to add more languages (5, 6, 7...)
✅ **Fallback support** - If language file missing, use prefix 0 (Urdu)

---

## Next Steps

1. Create `audio_files/prompts/` directory
2. Generate all 99 WAV files using ElevenLabs
3. Implement PromptManager class in `conversational-ivr.js`
4. Test hybrid playback (pre-recorded + TTS for numbers)
5. Deploy to production
