// syncNewConversations.js
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Email = require('./models/Email');
const SyncedConversation = require('./models/SyncedConversation');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGODB;

const elevenlabs = axios.create({
  baseURL: 'https://api.elevenlabs.io/v1/convai',
  headers: { 'xi-api-key': API_KEY }
});

const PROFILE_TITLES = ['farm profile creation'];

function isProfileConversation(item) {
  const title = (item.call_summary_title || '').toLowerCase();
  return PROFILE_TITLES.some(t => title.includes(t));
}

async function listConversations(cursor) {
  const { data } = await elevenlabs.get('/conversations', {
    params: {
      page_size: 30,
      ...(AGENT_ID ? { agent_id: AGENT_ID } : {}),
      ...(cursor ? { cursor } : {})
    }
  });
  return data;
}

async function getFullConversation(conversationId) {
  const { data } = await elevenlabs.get(`/conversations/${conversationId}`);
  return data;
}

async function extractProfileFromTranscript(transcript) {
  const conversationText = (transcript || [])
    .map(t => `${t.role}: ${t.message}`)
    .join('\n');

  const prompt = `Extract the farmer's profile info from this conversation transcript.
Return ONLY valid JSON, no markdown fences, no extra text — exactly these keys:
name, location, farmSize, crops, organic, selling, challenges, contact.

Rules:
- If a field was never mentioned in the transcript, use "Not mentioned" (never an empty string).
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
  const parsed = JSON.parse(clean);

  const fields = ['name', 'location', 'farmSize', 'crops', 'organic', 'selling', 'challenges', 'contact'];
  for (const f of fields) {
    if (!parsed[f] || parsed[f].trim() === '') {
      parsed[f] = 'Not mentioned';
    }
  }

  return parsed;
}

async function saveAsProfile(full, item) {
  const extracted = await extractProfileFromTranscript(full.transcript);

  await Email.create({
    id: Date.now(),
    timestamp: new Date(),
    profile: extracted,
    type: 'profile'
  });

  await SyncedConversation.create({
    conversationId: item.conversation_id,
    status: 'saved',
    title: item.call_summary_title || ''
  });

  console.log(`[sync] saved profile for ${item.conversation_id}:`, extracted);
}

async function saveAsSkipped(item) {
  await SyncedConversation.create({
    conversationId: item.conversation_id,
    status: 'skipped',
    title: item.call_summary_title || 'Untitled conversation'
  });
  console.log(`[sync] skipped: ${item.conversation_id} — "${item.call_summary_title}"`);
}

async function syncNewConversations() {
  console.log(`[sync] checking for new conversations — ${new Date().toLocaleString()}`);
  let cursor;
  let newProfiles = 0;

  while (true) {
    const page = await listConversations(cursor);

    for (const item of page.conversations) {
      if (item.status !== 'done') continue;

      const already = await SyncedConversation.exists({ conversationId: item.conversation_id });
      if (already) continue;

      if (isProfileConversation(item)) {
        const full = await getFullConversation(item.conversation_id);
        await saveAsProfile(full, item);
        newProfiles++;
      } else {
        await saveAsSkipped(item);
      }
    }

    if (!page.has_more) break;
    cursor = page.next_cursor;
  }

  console.log(`[sync] done — ${newProfiles} new profile(s) saved`);
}

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log('[sync] connected to MongoDB');
  await syncNewConversations();
  await mongoose.disconnect();
  console.log('[sync] disconnected.');
}

if (require.main === module) {
  start();
}

module.exports = { syncNewConversations };