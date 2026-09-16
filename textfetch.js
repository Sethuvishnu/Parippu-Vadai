// // testFetch.js
// require('dotenv').config();
// const axios = require('axios');

// const API_KEY = process.env.ELEVENLABS_API_KEY;
// const AGENT_ID = process.env.ELEVENLABS_AGENT_ID; // optional

// async function getLatestConversationId() {
//   const { data } = await axios.get(
//     'https://api.elevenlabs.io/v1/convai/conversations',
//     {
//       headers: { 'xi-api-key': API_KEY },
//       params: {
//         page_size: 2,
//         ...(AGENT_ID ? { agent_id: AGENT_ID } : {})
//       }
//     }
//   );

//   if (!data.conversations || data.conversations.length === 0) {
//     console.log('No conversations found on this account.');
//     return null;
//   }

//   const latest = data.conversations[1];
//   console.log('--- Latest conversation ---');
//   console.log('conversation_id :', latest.conversation_id);
//   console.log('agent_id        :', latest.agent_id);
//   console.log('status          :', latest.status);
//   console.log('started at      :', new Date(latest.start_time_unix_secs * 1000).toLocaleString());
//   console.log('duration (s)    :', latest.call_duration_secs);
//   console.log('messages        :', latest.message_count);

//   return latest.conversation_id;
// }

// async function getFullConversation(conversationId) {
//   const { data } = await axios.get(
//     `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
//     { headers: { 'xi-api-key': API_KEY } }
//   );
//   return data;
// }

// (async () => {
//   try {
//     const id = await getLatestConversationId();
//     if (!id) return;

//     const full = await getFullConversation(id);

//     console.log('\n--- Transcript ---');
//     (full.transcript || []).forEach(t => {
//       console.log(`[${t.role}] ${t.message}`);
//     });

//     console.log('\n--- Summary ---');
//     console.log(full.analysis?.transcript_summary || '(no summary yet)');
//   } catch (err) {
//     console.error('Error:', err.response?.status, err.response?.data || err.message);
//   }
// })();



// testFetch.js
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID; // optional
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function getLatestConversationId() {
  const { data } = await axios.get(
    'https://api.elevenlabs.io/v1/convai/conversations',
    {
      headers: { 'xi-api-key': API_KEY },
      params: {
        page_size: 2,
        ...(AGENT_ID ? { agent_id: AGENT_ID } : {})
      }
    }
  );

  if (!data.conversations || data.conversations.length === 0) {
    console.log('No conversations found on this account.');
    return null;
  }

  const latest = data.conversations[1];
  console.log('--- Latest conversation ---');
  console.log('conversation_id :', latest.conversation_id);
  console.log('agent_id        :', latest.agent_id);
  console.log('status          :', latest.status);
  console.log('started at      :', new Date(latest.start_time_unix_secs * 1000).toLocaleString());
  console.log('duration (s)    :', latest.call_duration_secs);
  console.log('messages        :', latest.message_count);

  return latest.conversation_id;
}

async function getFullConversation(conversationId) {
  const { data } = await axios.get(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    { headers: { 'xi-api-key': API_KEY } }
  );
  return data;
}

// NEW: extract structured profile fields from the transcript using Gemini
async function extractProfileFromTranscript(transcript) {
  const conversationText = (transcript || [])
    .map(t => `${t.role}: ${t.message}`)
    .join('\n');

  const prompt = `Extract the farmer's profile info from this conversation transcript.
Return ONLY valid JSON, no markdown fences, no extra text — exactly these keys:
name, location, farmSize, crops, organic, selling, challenges, contact.

Rules:
- If a field was never mentioned in the transcript, use "" (empty string).
- "organic": use "yes" or "no" based on what was said.
- "selling": combine how they sell + price info if both were mentioned.
- "contact": the phone number as stated.

Transcript:
${conversationText}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    
    { contents: [{ parts: [{ text: prompt }] }] },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const raw = response.data.candidates[0].content.parts[0].text;
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

(async () => {
  try {
    const id = await getLatestConversationId();
    if (!id) return;

    const full = await getFullConversation(id);

    console.log('\n--- Transcript ---');
    (full.transcript || []).forEach(t => {
      console.log(`[${t.role}] ${t.message}`);
    });

    console.log('\n--- Summary ---');
    console.log(full.analysis?.transcript_summary || '(no summary yet)');

    // NEW: extract + print the structured profile
    console.log('\n--- Extracted Profile ---');
    const profile = await extractProfileFromTranscript(full.transcript);
    console.log(profile);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
})();