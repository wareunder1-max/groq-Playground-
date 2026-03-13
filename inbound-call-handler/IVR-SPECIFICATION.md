# IVR System Specification - Banking Demo

## 1. System Overview

This is a **demo AI-powered conversational IVR** for a banking customer service line. The system uses natural language processing to understand customer requests and provide appropriate responses.

---

## 2. Supported Languages

### Primary Languages (Full Support)
1. **Urdu** (اردو) - Primary language
2. **English** - Secondary language

### Limited Support Languages (Recognition Only)
3. **Punjabi** (پنجابی) - Can recognize, responds in Urdu
4. **Pashto** (پشتو) - Can recognize, responds in Urdu
5. **Sindhi** (سندھی) - Can recognize, responds in Urdu

### Out of Scope
- Any other languages
- If detected, politely redirect to Urdu or English

---

## 3. Available Services (Demo Mode)

### Service 1: Balance Inquiry (بیلنس انکوائری)
**What it does**: Provides account balance information
**Requires**: Customer verification
**Demo Response**: Mock balance data

**Flow**:
1. Customer requests balance
2. System asks for verification (Account number + DOB)
3. System provides mock balance
4. Asks if anything else needed

### Service 2: Account Statement (اکاؤنٹ سٹیٹمنٹ)
**What it does**: Provides recent transaction summary
**Requires**: Customer verification
**Demo Response**: Mock statement summary

**Flow**:
1. Customer requests statement
2. System asks for verification (Account number + DOB)
3. System provides mock last 3 transactions
4. Asks if anything else needed

### Service 3: Branch Locator (برانچ کی معلومات)
**What it does**: Provides nearest branch information
**Requires**: Location/city name
**Demo Response**: Mock branch addresses

**Flow**:
1. Customer asks for branch location
2. System asks for city/area name
3. System provides 2-3 mock branch addresses
4. Asks if anything else needed

### Service 4: Loan Information (قرض کی معلومات)
**What it does**: Provides general loan information
**Requires**: Loan type (personal, home, car)
**Demo Response**: Mock loan details

**Flow**:
1. Customer asks about loans
2. System asks which type of loan
3. System provides mock interest rates and terms
4. Asks if anything else needed

### Service 5: Complaint Registration (شکایت درج کرانا)
**What it does**: Records customer complaint
**Requires**: Complaint details
**Demo Response**: Mock complaint reference number

**Flow**:
1. Customer wants to register complaint
2. System asks for complaint details
3. System provides mock reference number
4. Confirms complaint will be addressed in 24-48 hours

### Service 6: Customer Support Transfer (کسٹمر سپورٹ)
**What it does**: Transfers to human agent (simulated)
**Requires**: Nothing
**Demo Response**: Mock transfer message

**Flow**:
1. Customer requests human agent
2. System confirms transfer
3. Plays hold music message (demo ends here)

---

## 4. Out of Scope Services

The IVR will **politely decline** and redirect for:
- Account opening
- Card blocking/activation
- International transfers
- Investment advice
- Insurance products
- Credit card applications
- Any service not listed above

**Standard Response**:
```
"معذرت، یہ سروس فی الوقت دستیاب نہیں ہے۔ کیا میں آپ کو کسٹمر سپورٹ سے منسلک کر دوں؟"
"Sorry, this service is not currently available. Shall I connect you to customer support?"
```

---

## 5. Complete Conversation Flows

### Flow 1: Balance Inquiry (Full Example)

```
[CALL STARTS]

IVR: "صبح بخیر! آپ کی کالر آئی ڈی 03001234567 کے مطابق، آپ ہمارے کسٹمر ہیں۔ 
      بتائیں، میں آپ کی کیا خدمت کروں؟"
      (Good morning! According to your caller ID, you are our customer. 
      How can I help you?)

CUSTOMER: "مجھے اپنا بیلنس جاننا ہے"
          (I want to know my balance)

IVR: "بیلنس بتانے سے پہلے مجھے آپ سے کچھ معلومات درکار ہوں گی۔ 
      براہ کرم اپنا اکاؤنٹ نمبر بتائیں۔"
      (Before telling balance, I need some information. 
      Please tell your account number.)

CUSTOMER: "میرا اکاؤنٹ نمبر 1234567890 ہے"
          (My account number is 1234567890)

IVR: "شکریہ۔ اب اپنی تاریخ پیدائش بتائیں۔"
      (Thank you. Now tell your date of birth.)

CUSTOMER: "15 جنوری 1990"
          (15 January 1990)

IVR: "شکریہ۔ آپ کی شناخت تصدیق ہو گئی ہے۔ 
      آپ کا موجودہ بیلنس 50,000 روپے ہے۔ 
      کیا کوئی اور مدد چاہیے؟"
      (Thank you. Your identity is verified. 
      Your current balance is 50,000 rupees. 
      Do you need any other help?)

CUSTOMER: "نہیں شکریہ"
          (No, thank you)

IVR: "شکریہ۔ اللہ حافظ۔"
      (Thank you. Goodbye.)

[CALL ENDS]
```

### Flow 2: Branch Locator

```
IVR: "صبح بخیر! آپ کی کالر آئی ڈی کے مطابق، آپ ہمارے کسٹمر ہیں۔ 
      بتائیں، میں آپ کی کیا خدمت کروں؟"

CUSTOMER: "مجھے قریبی برانچ کا پتہ چاہیے"
          (I need the address of nearest branch)

IVR: "ضرور۔ آپ کس شہر میں برانچ تلاش کر رہے ہیں؟"
      (Sure. In which city are you looking for a branch?)

CUSTOMER: "لاہور"
          (Lahore)

IVR: "لاہور میں ہماری تین برانچیں ہیں۔ 
      ایک گلبرگ میں، ایک ڈیفنس میں، اور ایک جوہر ٹاؤن میں۔ 
      کیا کوئی خاص علاقہ چاہیے؟"
      (We have three branches in Lahore. 
      One in Gulberg, one in Defence, and one in Johar Town. 
      Do you need a specific area?)

CUSTOMER: "گلبرگ"
          (Gulberg)

IVR: "گلبرگ برانچ کا پتہ ہے: مین بلیوارڈ، گلبرگ 3، لاہور۔ 
      فون نمبر: 042-35714000۔ کھلنے کا وقت: صبح 9 سے شام 5 بجے تک۔ 
      کیا کوئی اور مدد چاہیے؟"
      (Gulberg branch address is: Main Boulevard, Gulberg 3, Lahore. 
      Phone: 042-35714000. Opening hours: 9 AM to 5 PM. 
      Any other help needed?)

CUSTOMER: "نہیں شکریہ"

IVR: "شکریہ۔ اللہ حافظ۔"

[CALL ENDS]
```

### Flow 3: Out of Scope Request

```
IVR: "صبح بخیر! بتائیں، میں آپ کی کیا خدمت کروں؟"

CUSTOMER: "مجھے نیا اکاؤنٹ کھولنا ہے"
          (I want to open a new account)

IVR: "معذرت، نیا اکاؤنٹ کھولنے کے لیے آپ کو برانچ میں جانا ہوگا۔ 
      کیا میں آپ کو قریبی برانچ کا پتہ بتا دوں؟"
      (Sorry, to open a new account you need to visit the branch. 
      Shall I tell you the nearest branch address?)

CUSTOMER: "ہاں"
          (Yes)

IVR: "آپ کس شہر میں ہیں؟"
      (Which city are you in?)

[CONTINUES WITH BRANCH LOCATOR FLOW]
```

### Flow 4: Language Not Supported

```
IVR: "صبح بخیر! بتائیں، میں آپ کی کیا خدمت کروں؟"

CUSTOMER: [Speaks in French/Arabic/Chinese]

IVR: "معذرت کے ساتھ، مجھے یہ زبان اچھی طرح نہیں آتی۔ 
      کیا آپ اردو یا انگلش میں بات کر سکتے ہیں؟"
      (Sorry, I don't know this language well. 
      Can you speak in Urdu or English?)

CUSTOMER: "Yes, I can speak English"

IVR: "Great! How can I help you today?"

[CONTINUES IN ENGLISH]
```

---

## 6. Verification Requirements

### Services Requiring Verification:
1. Balance Inquiry
2. Account Statement

### Verification Information Required:
1. **Account Number** (10-16 digits)
2. **Date of Birth** (DD/MM/YYYY or verbal format)

### Verification Process:
1. Ask for account number
2. Ask for date of birth
3. Confirm verification (always succeeds in demo mode)
4. Proceed with service

### Services NOT Requiring Verification:
1. Branch Locator
2. Loan Information (general)
3. Complaint Registration
4. Customer Support Transfer

---

## 7. Response Guidelines

### Length Limits:
- **Maximum**: 30 words per response
- **Ideal**: 15-20 words
- **Greeting**: Can be up to 35 words

### Tone:
- Warm and friendly
- Professional
- Helpful
- Patient

### Language Style:
- Simple, clear Urdu/English
- Avoid technical jargon
- Use common banking terms
- Speak naturally

### Response Time:
- Transcription: 300-500ms
- AI Response: 200-400ms
- TTS Generation: 1-2 seconds
- **Total**: 2-3 seconds per turn

---

## 8. Error Handling

### Scenario 1: No Speech Detected
**Response**: "معذرت، میں نے آپ کی آواز نہیں سنی۔ براہ کرم دوبارہ بولیں۔"
**Action**: Wait for customer to speak again
**Retry**: Up to 2 times, then end call

### Scenario 2: Unclear Speech
**Response**: "معذرت، میں سمجھ نہیں سکا۔ براہ کرم دوبارہ بتائیں۔"
**Action**: Ask customer to repeat
**Retry**: Up to 2 times, then offer transfer to agent

### Scenario 3: Service Not Available
**Response**: "معذرت، یہ سروس فی الوقت دستیاب نہیں ہے۔"
**Action**: Offer alternative service or transfer

### Scenario 4: Technical Error
**Response**: "معذرت، کچھ تکنیکی مسئلہ ہو رہا ہے۔ براہ کرم بعد میں کوشش کریں۔"
**Action**: End call gracefully

---

## 9. Call Flow Limits

### Maximum Call Duration: 5 minutes
### Maximum Conversation Turns: 10
### Maximum Silence Wait: 10 seconds
### Maximum Recording Duration: 30 seconds per turn

### After Limits Reached:
```
"شکریہ۔ اگر مزید مدد چاہیے تو دوبارہ کال کریں۔ اللہ حافظ۔"
(Thank you. If you need more help, please call again. Goodbye.)
```

---

## 10. Demo Data

### Mock Account Data:
```javascript
{
  accountNumber: "1234567890",
  balance: "50,000 روپے",
  lastTransactions: [
    "10 مارچ: ATM سے نکالی - 5,000 روپے",
    "8 مارچ: آن لائن ٹرانسفر - 10,000 روپے",
    "5 مارچ: تنخواہ جمع - 75,000 روپے"
  ]
}
```

### Mock Branch Data:
```javascript
{
  lahore: [
    { name: "گلبرگ برانچ", address: "مین بلیوارڈ، گلبرگ 3", phone: "042-35714000" },
    { name: "ڈیفنس برانچ", address: "مین بلیوارڈ، ڈی ایچ اے", phone: "042-35714001" },
    { name: "جوہر ٹاؤن برانچ", address: "بلاک H، جوہر ٹاؤن", phone: "042-35714002" }
  ],
  karachi: [
    { name: "کلفٹن برانچ", address: "مین کلفٹن روڈ", phone: "021-35714000" },
    { name: "گلشن برانچ", address: "گلشن اقبال", phone: "021-35714001" }
  ]
}
```

### Mock Loan Data:
```javascript
{
  personal: { rate: "12%", term: "5 سال تک", minAmount: "50,000 روپے" },
  home: { rate: "10%", term: "20 سال تک", minAmount: "10 لاکھ روپے" },
  car: { rate: "14%", term: "7 سال تک", minAmount: "5 لاکھ روپے" }
}
```

---

## 11. System Prompt Template

```
You are a friendly AI customer service assistant for a Pakistani bank's phone system.

STRICT RULES:
1. Keep responses under 25 words
2. Only provide these services: Balance, Statement, Branch Info, Loans, Complaints
3. Only support: Urdu, English (primary), Punjabi/Pashto/Sindhi (recognize only)
4. Always verify for Balance/Statement requests
5. Use demo data only - never claim real data
6. Stay in scope - redirect out-of-scope requests
7. Be warm, professional, and helpful

GREETING FORMAT:
"صبح بخیر! آپ کی کالر آئی ڈی {number} کے مطابق، آپ ہمارے کسٹمر ہیں۔ بتائیں، میں آپ کی کیا خدمت کروں؟"

VERIFICATION FORMAT (for Balance/Statement):
"بیلنس بتانے سے پہلے مجھے آپ سے کچھ معلومات درکار ہوں گی۔ براہ کرم اپنا اکاؤنٹ نمبر بتائیں۔"

OUT OF SCOPE RESPONSE:
"معذرت، یہ سروس فی الوقت دستیاب نہیں ہے۔ کیا میں آپ کو کسٹمر سپورٹ سے منسلک کر دوں؟"

Remember: This is a DEMO system. Always be helpful within scope!
```

---

## 12. Testing Checklist

### Language Tests:
- [ ] Urdu greeting and responses
- [ ] English greeting and responses
- [ ] Punjabi recognition (respond in Urdu)
- [ ] Pashto recognition (respond in Urdu)
- [ ] Sindhi recognition (respond in Urdu)
- [ ] Unsupported language handling

### Service Tests:
- [ ] Balance inquiry with verification
- [ ] Account statement with verification
- [ ] Branch locator (multiple cities)
- [ ] Loan information (all types)
- [ ] Complaint registration
- [ ] Customer support transfer

### Error Handling Tests:
- [ ] No speech detected
- [ ] Unclear speech
- [ ] Out of scope request
- [ ] Unsupported language
- [ ] Maximum turns reached
- [ ] Technical error

### Edge Cases:
- [ ] Customer interrupts greeting
- [ ] Customer changes request mid-conversation
- [ ] Customer provides wrong verification info
- [ ] Customer asks for multiple services
- [ ] Silent call
- [ ] Background noise

---

## 13. Success Metrics

### Target Metrics:
- **Call Completion Rate**: >90%
- **Average Call Duration**: 60-90 seconds
- **Language Detection Accuracy**: >95%
- **Service Identification Accuracy**: >85%
- **Customer Satisfaction**: Positive tone in goodbye

### Monitoring:
- Log all conversations
- Track service usage
- Monitor error rates
- Analyze call durations
- Review transcription accuracy

---

## 14. Future Enhancements (Out of Current Scope)

1. **Barge-in support** - Stop talking when customer speaks
2. **DTMF fallback** - Keypad options
3. **Real backend integration** - Actual account data
4. **Multi-factor authentication** - OTP verification
5. **Call recording** - For quality assurance
6. **Sentiment analysis** - Detect frustrated customers
7. **Queue integration** - Transfer to live agents
8. **Callback feature** - Call customer back
9. **SMS confirmation** - Send details via SMS
10. **More languages** - Regional language support

---

## 15. Implementation Priority

### Phase 1 (Current): Core IVR
- ✅ Basic conversation flow
- ✅ Language detection
- ✅ Service identification
- ✅ Demo responses

### Phase 2 (Next): Enhanced Features
- ⏳ Barge-in support
- ⏳ Better error handling
- ⏳ More natural responses
- ⏳ Improved verification

### Phase 3 (Future): Production Ready
- ⏳ Real backend integration
- ⏳ Security enhancements
- ⏳ Performance optimization
- ⏳ Advanced analytics

---

## 16. Contact & Support

For questions or issues with this IVR specification:
- Review conversation logs in `/var/log/inbound-call-handler/`
- Check this specification document
- Test with the provided conversation flows
- Ensure all services stay within defined scope

**Remember**: This is a DEMO system. Keep it simple, focused, and within scope!
