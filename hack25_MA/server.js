import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from "mongoose";

import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);



dotenv.config();




const app = express();

app.use(express.json())

// const {
//     ELEVENLABS_API_KEY,
//     ELEVENLABS_AGENT_ID,
//     ELEVENLABS_AGENT_PHONE_NUMBER_ID,
//     GEMINI_API_KEY,
// } = process.env;

// if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID || !ELEVENLABS_AGENT_PHONE_NUMBER_ID) {
//     console.warn('[WARN] Missing ELEVENLABS env vars. Fill .env to enable phone calling.');
// }

// if (!GEMINI_API_KEY) {
//     console.warn('[WARN] Missing GEMINI_API_KEY. Fill .env to enable doubt solving.');
// }


// app.use(helmet());
// app.use(morgan('dev'));


// CORS: front-end origin only
// const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const PORT =  4001;
// Static hosting
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));


app.use(cors({
  origin: 'http://localhost:4001', // your front-end origin
  methods: ['GET','POST']
}));




// app.use(helmet());
// app.use(morgan('dev'));





const uri = process.env.MONGODB;
mongoose.connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log("Error connecting to MongoDB:", error));




  const emailSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  profile: {
    name: { type: String, required: true },
    location: { type: String, required: true },
    farmSize: { type: String, required: true },
    crops: { type: String, required: true },
    organic: { type: String, required: true },
    selling: { type: String, required: true },
    challenges: { type: String, required: true },
    contact: { type: String, required: true }
  },
   type: { type: String, required: true }
});

const Email = mongoose.model('Email', emailSchema);




/////////////////////////////////////////////////////////////////////////////////////////////////


// const app = express();
// const PORT = 4001;

// Replace these with your actual keys
const API_KEY = "ENTER YOUR API"
const CONVERSATION_ID = "ENTER YOUR API"

// ---------------------------
// // Helper: Fetch ElevenLabs conversation
// // ---------------------------
// async function fetchConversation(conversationId) {
//   const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
//   try {
//     const response = await axios.get(url, {
//       headers: { "xi-api-key": API_KEY },
//     });

//     const transcriptList = response.data.transcript || [];
//     if (!transcriptList.length) return "";

//     let transcriptText = "";
//     transcriptList.forEach((entry) => {
//       const role = entry.role === "user" ? "YOU" : "AGENT";
//       transcriptText += `${role}: ${entry.message}\n------------------------------\n`;
//     });

//     return transcriptText;
//   } catch (err) {
//     console.error("Error fetching conversation:", err.response?.data || err);
//     return "";
//   }
// }

// function extractFarmData(transcript) {
//   // Here we mock it for simplicity
//   const profile = {
//     name: "Navani Krishnan",
//     location: "Kollam, Kerala",
//     farmSize: "10 acres",
//     crops: "bananas",
//     organic: "no",
//     selling: "to a broker / middleman",
//     challenges: "",
//     contact: "9562664079",
//   };
//   return profile;
// }

// // ---------------------------
// // API Endpoint
// // ---------------------------
// app.get("/farm-profile", async (req, res) => {
//   const transcript = await fetchConversation(CONVERSATION_ID);
//   if (!transcript) {
//     return res.status(500).json({ error: "Could not fetch conversation" });
//   }

//   const profile = extractFarmData(transcript);

//   const finalOutput = {
//     id: Date.now(),
//     timestamp: new Date().toISOString(),
//     profile: profile,
//     type: "profile",
//   };

//   // Return JSON response
//   res.json(finalOutput);
//   console.log("Final Output:", finalOutput);
// });



/////////////////////////////////////////////////////////////////////////////////////////////








app.post('/save', async (req, res) => {
  // Destructure multiple values from request body
  const { id, timestamp, profile, type } = req.body;
  console.log("Hello endpoifffffffffffffffffffffffffffffffnt hit");

  console.log("Received data:", req.body);

  const count = await Email.countDocuments();

  try {
    const newEmail = new Email({
       id,
      timestamp,
      profile,      // this contains all nested fields
      type
    });

    await newEmail.save();
    res.status(200).json({ success: true, message: 'Survey saved!', total: count + 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error saving survey' });
  }
});

// app.post('/savenew', async (req, res) => {
//   // Destructure multiple values from request body
//   const { id, timestamp, profile, type } = req.body;
//   console.log("Hello endpoifffffffffffffffffffffffffffffffnt hit");

//   console.log("Received data:", req.body);

//   const count = await Email.countDocuments();

//   try {
//     const newEmail = new Email({
//        id,
//       timestamp,
//       profile,      // this contains all nested fields
//       type
//     });

//     await newEmail.save();
//     res.status(200).json({ success: true, message: 'Survey saved!', total: count + 1 });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error saving survey' });
//   }
// });




// Replace these with your actual keys
// const API_KEY = "sk_fbd27d80bee240d6dfb2e969eafddc22360af0b7e99ac309";
// const CONVERSATION_ID = "conv_7501kgvm1bhzfvtsqcf03ydh7cfv";

// Helper: Fetch ElevenLabs conversation
async function fetchConversation(conversationId) {
  const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
  try {
    const response = await axios.get(url, {
      headers: { "xi-api-key": API_KEY },
    });

    const transcriptList = response.data.transcript || [];
    if (!transcriptList.length) return "";

    let transcriptText = "";
    transcriptList.forEach((entry) => {
      const role = entry.role === "user" ? "YOU" : "AGENT";
      transcriptText += `${role}: ${entry.message}\n------------------------------\n`;
    });

    return transcriptText;
  } catch (err) {
    console.error("Error fetching conversation:", err.response?.data || err);
    return "";
  }
}

// Mocked function to extract farm data
function extractFarmData(transcript) {
  // Here we mock it for simplicity
  return {
    name: "Navani Krishnan",
    location: "Kollam, Kerala",
    farmSize: "10 acres",
    crops: "bananas",
    organic: "no",
    selling: "to a broker / middleman",
    challenges: "",
    contact: "9562664079",
  };
}

// ---------------------------
// POST /savenew - Fetch, extract, and save profile
// ---------------------------
app.post('/savenew', async (req, res) => {
  console.log("Hello endpoint hit");

  try {
    // 1️⃣ Fetch conversation transcript


    console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
    const transcript = await fetchConversation(CONVERSATION_ID);
    
    if (!transcript) {
      return res.status(500).json({ success: false, message: "Failed to fetch conversation" });
    }
    console.log("Fetched Transcript:", transcript);

    // 2️⃣ Extract profile data
    const profile = extractFarmData(transcript);

    // 3️⃣ Generate metadata
    const id = Date.now();
    const timestamp = new Date().toISOString();
    const type = "profile";

    const count = await Email.countDocuments();

    // 4️⃣ Save to MongoDB
    const newEmail = new Email({ id, timestamp, profile, type });
    await newEmail.save();

    // 5️⃣ Respond with saved profile
    res.status(200).json({
      success: true,
      message: 'Profile fetched and saved!',
      total: count + 1,
      data: { id, timestamp, profile, type }
    });

    console.log("Profile saved:", { id, timestamp, profile, type });

  } catch (error) {
    console.error("Error in /savenew:", error);
    res.status(500).json({ success: false, message: "Error saving profile" });
  }
});






app.post('/savenew1', async (req, res) => {
  // Directly define the profile data
  const fixedProfile = {
  "id": 1770459155464,
  "timestamp": "2026-02-07T10:12:35.464742Z",
  "profile": {
    "name": "Navani Krishnan",
    "location": "Kollam, Kerala",
    "farmSize": "10 acres",
    "crops": "bananas (seasonal)",
    "organic": "Standard",
    "selling": "Broker",
    "challenges": "",
    "contact": "9562664079"
  },
  "type": "profile"
}

  try {
    const newEmail = new Email(fixedProfile);
    await newEmail.save();

    console.log("Saved fixed profile:", fixedProfile);
    res.status(200).json({ success: true, message: "Fixed profile saved!", profile: fixedProfile });
  } catch (error) {
    console.error("Error saving fixed profile:", error);
    res.status(500).json({ success: false, message: "Error saving profile", error: error.message });
  }
});




app.post('/savenew123', async (req, res) => {
  try {
    console.log("Fetching conversation...");

    // 1️⃣ Fetch transcript from ElevenLabs
    const transcript = await fetchConversation(CONVERSATION_ID);

    if (!transcript) {
      return res.status(500).json({ success: false, message: "Failed to fetch conversation" });
    }

    console.log("Transcript fetched:", transcript);

    // 2️⃣ Extract farm profile (mocking like your Python structured extraction)
    const profile = {
      name: "Navani Krishnan",
      location: "Kollam, Kerala",
      farmSize: "10 acres",
      crops: "bananas (seasonal)",
      organic: "Standard",
      selling: "Broker",
      challenges: "", // fill from transcript if available
      contact: "9562664079"
    };

    // 3️⃣ Add metadata
    const id = Date.now(); // unique id
    const timestamp = new Date().toISOString();
    const type = "profile";

    // 4️⃣ Save to MongoDB
    const newEmail = new Email(
        
    );
    await newEmail.save();

    console.log("Profile saved:", { id, timestamp, profile, type });

    // 5️⃣ Respond with final JSON
    res.status(200).json({
      success: true,
      message: "Profile fetched and saved!",
      data: { id, timestamp, profile, type }
    });

  } catch (error) {
    console.error("Error in /savenew:", error);
    res.status(500).json({ success: false, message: "Error saving profile", error: error.message });
  }
});


















// Health
// app.get('/api/health', (_req, res) => res.json({ ok: true }));

// app.post('/api/solve-doubt', async (req, res) => {
//     try {
//         if (!GEMINI_API_KEY) {
//             return res.status(500).json({ error: 'Server misconfigured: GEMINI_API_KEY missing.' });
//         }

//         const { doubt, conversationHistory = [] } = req.body || {};
//         if (typeof doubt !== 'string' || !doubt.trim()) {
//             return res.status(400).json({ error: 'Invalid "doubt". Provide a farming question.' });
//         }

//         // Check if user is saying thank you (end conversation)
//         const thankYouPatterns = [
//             /thank\s*you/i,
//             /thanks/i,
//             /bye/i,
//             /goodbye/i,
//             /that's\s*all/i,
//             /that's\s*enough/i,
//             /no\s*more\s*questions/i
//         ];

//         const isThankYou = thankYouPatterns.some(pattern => pattern.test(doubt.trim()));

//         if (isThankYou) {
//             return res.json({
//                 answer: "You're welcome! Call back anytime for more farming help. Have a great day!",
//                 isConversationEnd: true
//             });
//         }

//         // Initialize the Google Generative AI client (similar to Python version)
//         const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

//         // Get the model - using gemini-1.5-flash (stable available model)
//         // Configuration optimized for concise phone call responses
//         const model = genAI.getGenerativeModel({
//             model: "gemini-1.5-flash",
//             generationConfig: {
//                 temperature: 0.3,      // Lower creativity for more focused responses
//                 topP: 0.8,            // More focused responses
//                 topK: 20,             // Limited token sampling for brevity
//                 maxOutputTokens: 200, // Very concise answers for phone simulation
//             },
//             // Optimized for quick, direct phone conversation responses
//         });

//         // Build conversation context
//         let conversationContext = '';
//         if (conversationHistory.length > 0) {
//             conversationContext = '\n\nPrevious conversation:\n';
//             conversationHistory.forEach(item => {
//                 conversationContext += `Farmer: ${item.question}\nAdvisor: ${item.answer}\n\n`;
//             });
//         }

//         // Construct the prompt for farming-specific context with conversation history
//         const prompt = `You are an expert agricultural advisor on a phone call with a farmer. Give SHORT, practical answers in 1-2 sentences maximum. Speak like you're talking on the phone - be direct and helpful.${conversationContext}

// Current Farmer's Question: ${doubt}

// Give a brief, actionable answer (max 30 words). If you need more info, ask one short follow-up question:`;

//         // Generate content (similar to Python client.models.generate_content)
//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         const answer = response.text();

//         if (!answer || answer.trim() === '') {
//             throw new Error('Empty response from AI model');
//         }

//         res.json({
//             answer: answer.trim(),
//             isConversationEnd: false
//         });
//     } catch (err) {
//         console.error('Gemini API error:', err.message || err);

//         // Fallback response for errors
//         const fallbackAnswer = "Sorry, connection issue. Can you repeat your question?";

//         res.status(500).json({
//             error: `Doubt solving failed: ${err.message}`,
//             fallback: fallbackAnswer
//         });
//     }
// });

// Start a phone call via ElevenLabs ConvAI (server-side only)
// app.post('/api/start-call', async (req, res) => {
//     try {
//         if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID || !ELEVENLABS_AGENT_PHONE_NUMBER_ID) {
//             return res.status(500).json({ error: 'Server misconfigured: ElevenLabs env vars missing.' });
//         }

//         const { to_number } = req.body || {};
//         if (typeof to_number !== 'string' || !to_number.replace(/\D/g, '').match(/^\d{10,}$/)) {
//             return res.status(400).json({ error: 'Invalid "to_number". Provide a real phone number.' });
//         }

//         const url = 'https://api.elevenlabs.io/v1/convai/twilio/outbound-call';

//         const payload = {
//             agent_id: ELEVENLABS_AGENT_ID,
//             agent_phone_number_id: ELEVENLABS_AGENT_PHONE_NUMBER_ID,
//             to_number
//         };

//         const { data } = await axios.post(url, payload, {
//             headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
//             timeout: 20000
//         });

//         // Expected: { success, message, conversation_id, callSid, ... }
//         res.json(data);
//     } catch (err) {
//         const msg = err?.response?.data?.message || err?.response?.data || err.message;
//         res.status(500).json({ error: `ElevenLabs call failed: ${msg}` });
//     }
// });

// // Optional: fetch conversation metadata (status/transcript availability)
// // NOTE: Endpoint names may evolve; adjust to your account docs if needed.
// app.get('/api/conversation/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const url = `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(id)}`;

//         const { data } = await axios.get(url, {
//             headers: { 'xi-api-key': ELEVENLABS_API_KEY }
//         });

//         res.json(data);
//     } catch (err) {
//         const msg = err?.response?.data?.message || err?.response?.data || err.message;
//         res.status(500).json({ error: `Failed to fetch conversation: ${msg}` });
//     }
// });

// Fallback to index.html (single-page style)

// npm install express axios


// ---------------------------
// Helper: Extract farm profile (mock / replace with AI call if needed)
// ---------------------------


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
});
