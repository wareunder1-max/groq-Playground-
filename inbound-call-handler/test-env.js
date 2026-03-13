const axios = require('axios');
const ariClient = require('ari-client');
require('dotenv').config();

console.log('🧪 Testing Environment Configuration...\n');

// Test 1: Check environment variables
console.log('1️⃣ Checking environment variables...');
const requiredVars = [
  'ASTERISK_HOST',
  'ASTERISK_PORT',
  'ASTERISK_USERNAME',
  'ASTERISK_PASSWORD',
  'ASTERISK_APP_NAME',
  'GROQ_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID'
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: ${varName.includes('KEY') || varName.includes('PASSWORD') ? '***' : process.env[varName]}`);
  } else {
    console.log(`   ❌ ${varName}: MISSING`);
    allVarsPresent = false;
  }
});

if (!allVarsPresent) {
  console.log('\n❌ Some environment variables are missing. Please check your .env file.');
  process.exit(1);
}

console.log('\n✅ All environment variables present\n');

// Test 2: Test Groq API
async function testGroqAPI() {
  console.log('2️⃣ Testing Groq API...');
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "test successful"' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✅ Groq API: Connected successfully');
    console.log(`   📝 Response: ${response.data.choices[0].message.content}`);
    return true;
  } catch (error) {
    console.log('   ❌ Groq API: Failed');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 3: Test ElevenLabs API
async function testElevenLabsAPI() {
  console.log('\n3️⃣ Testing ElevenLabs API...');
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text: 'Test',
        model_id: 'eleven_turbo_v2_5'
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    console.log('   ✅ ElevenLabs API: Connected successfully');
    console.log(`   🔊 Audio generated: ${response.data.byteLength} bytes`);
    return true;
  } catch (error) {
    console.log('   ❌ ElevenLabs API: Failed');
    console.log(`   Error: ${error.response?.data?.detail?.message || error.message}`);
    return false;
  }
}

// Test 4: Test Asterisk ARI connection
async function testAsteriskARI() {
  console.log('\n4️⃣ Testing Asterisk ARI connection...');
  return new Promise((resolve) => {
    ariClient.connect(
      `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}`,
      process.env.ASTERISK_USERNAME,
      process.env.ASTERISK_PASSWORD,
      (err, ari) => {
        if (err) {
          console.log('   ❌ Asterisk ARI: Connection failed');
          console.log(`   Error: ${err.message}`);
          console.log('   💡 Make sure Asterisk is running and ARI is enabled');
          resolve(false);
        } else {
          console.log('   ✅ Asterisk ARI: Connected successfully');
          console.log(`   📡 Connected to: ${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT}`);
          
          // Try to get channels to verify permissions
          ari.channels.list((err, channels) => {
            if (err) {
              console.log('   ⚠️  Warning: Could not list channels (permissions issue?)');
            } else {
              console.log(`   📞 Active channels: ${channels.length}`);
            }
            resolve(true);
          });
        }
      }
    );
  });
}

// Run all tests
(async () => {
  const groqOk = await testGroqAPI();
  const elevenLabsOk = await testElevenLabsAPI();
  const asteriskOk = await testAsteriskARI();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  console.log(`Environment Variables: ✅`);
  console.log(`Groq API: ${groqOk ? '✅' : '❌'}`);
  console.log(`ElevenLabs API: ${elevenLabsOk ? '✅' : '❌'}`);
  console.log(`Asterisk ARI: ${asteriskOk ? '✅' : '❌'}`);
  console.log('='.repeat(50));
  
  if (groqOk && elevenLabsOk && asteriskOk) {
    console.log('\n🎉 All tests passed! Your environment is ready.');
    console.log('💡 Run "npm start" to start the call handler.');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  }
  
  process.exit(0);
})();
