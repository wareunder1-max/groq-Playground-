# IVR Testing Guide

## Quick Start

```bash
# Start the conversational IVR
node conversational-ivr.js

# Call extension 9995 from your phone
```

---

## Test Scenarios

### ✅ Test 1: Balance Inquiry with TPIN (Happy Path)

**What to say**:
1. "مجھے اپنا بیلنس جاننا ہے" (I want to know my balance)
2. "7878" (Correct TPIN)

**Expected Response**:
- Asks for TPIN: "بیلنس بتانے سے پہلے، براہ کرم اپنا TPIN بتائیں یا فون سے انٹر کریں۔"
- Verifies TPIN: "شکریہ، آپ کا TPIN درست ہے۔"
- Provides balance: "آپ کا موجودہ بیلنس 50,000 روپے ہے۔"
- Asks if anything else needed

---

### ✅ Test 1b: Balance Inquiry with Wrong TPIN (Error Path)

**What to say**:
1. "مجھے اپنا بیلنس جاننا ہے" (I want to know my balance)
2. "1234" (Wrong TPIN)
3. "ہاں" (Yes, retry)
4. "7878" (Correct TPIN)

**Expected Response**:
- Asks for TPIN
- Says TPIN incorrect: "معذرت، یہ TPIN ٹھیک نہیں ہے۔ کیا آپ دوبارہ کوشش کریں گے؟"
- Asks for TPIN again after "ہاں"
- Verifies correct TPIN
- Provides balance

---

### ✅ Test 1c: Balance Inquiry - Give Up After Wrong TPIN

**What to say**:
1. "مجھے اپنا بیلنس جاننا ہے" (I want to know my balance)
2. "1234" (Wrong TPIN)
3. "نہیں" (No, don't retry)

**Expected Response**:
- Asks for TPIN
- Says TPIN incorrect: "معذرت، یہ TPIN ٹھیک نہیں ہے۔ کیا آپ دوبارہ کوشش کریں گے؟"
- After "نہیں": "کوئی بات نہیں۔ میں آپ کی کوئی اور مدد کر سکتا ہوں؟"
- Returns to main menu

---

### ✅ Test 1d: Balance Inquiry - Max Attempts Reached

**What to say**:
1. "مجھے اپنا بیلنس جاننا ہے" (I want to know my balance)
2. "1234" (Wrong TPIN - attempt 1)
3. "ہاں" (Yes, retry)
4. "5678" (Wrong TPIN - attempt 2)

**Expected Response**:
- Asks for TPIN
- First wrong: "معذرت، یہ TPIN ٹھیک نہیں ہے۔ کیا آپ دوبارہ کوشش کریں گے؟"
- Asks for TPIN again
- Second wrong: "معذرت، TPIN دوبارہ غلط ہے۔ کیا میں آپ کی کوئی اور مدد کر سکتا ہوں؟"
- Returns to main menu

---

### ✅ Test 2: Branch Locator

**What to say**:
1. "مجھے قریبی برانچ کا پتہ چاہیے" (I need nearest branch address)
2. "لاہور" (Lahore)
3. "گلبرگ" (Gulberg)

**Expected Response**:
- Asks for city
- Provides branch options
- Asks which area
- Provides specific branch address and phone

---

### ✅ Test 3: Account Statement with TPIN

**What to say**:
1. "مجھے اپنا سٹیٹمنٹ چاہیے" (I want my statement)
2. "7878" (Correct TPIN)

**Expected Response**:
- Asks for TPIN
- Verifies TPIN
- Provides last 3 transactions
- Asks if anything else needed

---

### ✅ Test 4: Loan Information

**What to say**:
1. "مجھے قرض کی معلومات چاہیے" (I need loan information)
2. "پرسنل لون" (Personal loan)

**Expected Response**:
- Asks which type of loan
- Provides interest rate (12%)
- Provides terms (5 years)
- Asks if anything else needed

---

### ✅ Test 5: Out of Scope Request

**What to say**:
1. "مجھے نیا اکاؤنٹ کھولنا ہے" (I want to open new account)

**Expected Response**:
- Politely says service not available
- Offers to connect to customer support OR
- Offers alternative (branch locator)

---

### ✅ Test 6: Language Switch

**What to say**:
1. [Speak in French/Arabic/Chinese]

**Expected Response**:
- Says language not supported
- Asks to speak in Urdu or English

**Then say**:
2. "Yes, I can speak English"

**Expected Response**:
- Switches to English
- Asks how to help

---

### ✅ Test 7: Multiple Services

**What to say**:
1. "مجھے بیلنس چاہیے" (I want balance)
2. [Complete verification]
3. "اب مجھے برانچ کا پتہ بھی چاہیے" (Now I also need branch address)

**Expected Response**:
- Provides balance first
- Then asks for city for branch
- Provides branch information
- Asks if anything else needed

---

### ✅ Test 8: Complaint Registration

**What to say**:
1. "مجھے شکایت درج کرانی ہے" (I want to register complaint)
2. "میرا ATM کارڈ کام نہیں کر رہا" (My ATM card is not working)

**Expected Response**:
- Asks for complaint details
- Provides reference number
- Confirms will be addressed in 24-48 hours

---

## Expected Behaviors

### ✓ Good Signs:
- Responses are short (under 25 words)
- AI stays in scope
- Asks for verification when needed
- Provides demo data correctly
- Handles language switches
- Polite and professional tone

### ✗ Bad Signs:
- Long responses (over 30 words)
- Goes out of scope
- Forgets to verify
- Claims real data
- Doesn't handle unsupported languages
- Rude or unprofessional

---

## Demo Data Reference

### TPIN Verification:
- **Correct TPIN**: 7878
- **Any other TPIN**: Will be rejected
- **Max Attempts**: 2 attempts allowed
- **Retry Options**: 
  - Say "ہاں" or "yes" to retry
  - Say "نہیں" or "no" to return to main menu

### Account Information:
- **Balance**: 50,000 روپے (after TPIN verification)
- **Transactions** (after TPIN verification):
  - 10 مارچ: ATM سے نکالی - 5,000 روپے
  - 8 مارچ: آن لائن ٹرانسفر - 10,000 روپے
  - 5 مارچ: تنخواہ جمع - 75,000 روپے

### Branch Locations:

**Lahore**:
- گلبرگ برانچ: مین بلیوارڈ، گلبرگ 3، فون: 042-35714000
- ڈیفنس برانچ: مین بلیوارڈ، ڈی ایچ اے، فون: 042-35714001
- جوہر ٹاؤن برانچ: بلاک H، جوہر ٹاؤن، فون: 042-35714002

**Karachi**:
- کلفٹن برانچ: مین کلفٹن روڈ، فون: 021-35714000
- گلشن برانچ: گلشن اقبال، فون: 021-35714001

### Loan Information:
- **Personal Loan**: 12% interest, up to 5 years
- **Home Loan**: 10% interest, up to 20 years
- **Car Loan**: 14% interest, up to 7 years

---

## Troubleshooting

### Issue: AI gives long responses
**Solution**: Check system prompt, ensure max_tokens=100

### Issue: AI goes out of scope
**Solution**: Review system prompt, add more specific boundaries

### Issue: Verification not working
**Solution**: Check conversation history, ensure AI remembers context

### Issue: Language detection fails
**Solution**: Check Groq Whisper transcription accuracy

### Issue: TTS sounds unnatural
**Solution**: Adjust ElevenLabs voice settings (stability, similarity_boost)

---

## Performance Benchmarks

### Target Metrics:
- **Transcription**: < 500ms
- **AI Response**: < 400ms
- **TTS Generation**: < 2s
- **Total Turn Time**: < 3s

### Call Metrics:
- **Average Duration**: 60-90 seconds
- **Max Turns**: 10
- **Completion Rate**: > 90%

---

## Logs to Check

### Main Log:
```bash
tail -f /var/log/inbound-call-handler/conversational-ivr-2026-03-10.log
```

### Call-Specific Log:
```bash
tail -f /var/log/inbound-call-handler/call-{channelId}.log
```

### What to Look For:
- ✅ RECORDING_START / RECORDING_COMPLETE
- ✅ TRANSCRIPTION_COMPLETE
- ✅ AI_RESPONSE
- ✅ PLAYBACK_START / PLAYBACK_FINISHED
- ❌ Any ERROR events

---

## Success Criteria

A successful test call should:
1. ✅ Answer within 2 seconds
2. ✅ Greet with caller ID
3. ✅ Understand customer request
4. ✅ Stay within defined services
5. ✅ Verify when needed
6. ✅ Provide demo data correctly
7. ✅ Keep responses short
8. ✅ End politely
9. ✅ Complete in under 2 minutes
10. ✅ Log all events properly

---

## Next Steps After Testing

1. ✅ Verify all 8 test scenarios pass
2. ✅ Check logs for errors
3. ✅ Review response lengths
4. ✅ Test edge cases
5. ✅ Optimize system prompt if needed
6. ✅ Add more demo data if needed
7. ✅ Implement barge-in (optional)
8. ✅ Add DTMF fallback (optional)

---

## Quick Commands

```bash
# Start IVR
node conversational-ivr.js

# View logs
tail -f /var/log/inbound-call-handler/*.log

# Check Asterisk
asterisk -rx "core show channels"

# Restart if needed
# Ctrl+C then restart
```

Happy Testing! 🎉
