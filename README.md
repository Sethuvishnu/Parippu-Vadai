# FarmLink

FarmLink connects farmers with vendors and buyers. Farmers can create their farm profile either through the website or by talking to an AI voice agent (built with ElevenLabs Conversational AI). Voice conversations are automatically transcribed, analyzed, and converted into structured farm profiles stored in MongoDB — so a farmer can complete their profile with a phone call instead of filling out a form.

## How it works

1. A farmer calls (or is called by) the FarmLink voice agent, powered by ElevenLabs Conversational AI.
2. The agent asks about the farmer's name, location, farm size, crops, farming practices, selling method, challenges, and contact info.
3. After the call, `syncNewConversations.js` pulls the conversation from the ElevenLabs API.
4. Conversations titled **"Farm Profile Creation"** are sent to Google Gemini, which extracts the answers into a clean, structured JSON object.
5. That structured profile is saved to MongoDB in the same format as profiles submitted through the website.
6. The Express + EJS website reads from MongoDB and displays all farmer profiles — whether they came from the web form or a phone call.

Every conversation is tracked by its ElevenLabs `conversation_id`, so re-running the sync never creates duplicate profiles — only genuinely new conversations get processed.

## Tech stack

- **Backend:** Node.js, Express
- **Views:** EJS
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + cookies
- **Voice AI:** ElevenLabs Conversational AI
- **Structured extraction:** Google Gemini API
- **Scheduling (optional):** node-cron

## Prerequisites

- Node.js (v18+ recommended)
- A MongoDB connection string (local or Atlas)
- An ElevenLabs account with a Conversational AI agent set up
- A Google Gemini API key

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Sethuvishnu/Parippu-Vadai.git
   cd Parippu-Vadai/node-express-jwt-auth
   npm install
   ```

2. Create a `.env` file in the project root with the following variables:

   ```env
   MONGODB=your_mongodb_connection_string
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

   > `.env` is git-ignored — never commit real API keys.

## Running the project

### Start the website

```bash
nodemon app
```

Runs the Express server with EJS views at **http://localhost:3000**.

### Sync voice conversations into MongoDB

```bash
node syncNewConversations.js
```

- Fetches the latest conversations from the ElevenLabs API.
- Skips any conversation already processed (tracked in the `SyncedConversation` collection).
- For conversations titled **"Farm Profile Creation"**, extracts structured profile data via Gemini and saves it to the `Email` (profile) collection.
- All other conversations are logged as `skipped` so they're never reprocessed.

This can be run manually, on a schedule via `node-cron` (already wired into `app.js`), or triggered by a webhook for near real-time syncing.

## Project structure

```
node-express-jwt-auth/
├── app.js                     # Express app entry point
├── syncNewConversations.js    # Pulls ElevenLabs conversations → extracts profiles → saves to MongoDB
├── controllers/                # Route logic (auth, etc.)
├── middleware/                 # Auth middleware
├── models/
│   ├── Email.js                 # Farm profile documents
│   ├── SyncedConversation.js    # Tracks which conversation IDs have been processed
│   └── User.js                  # User accounts
├── routes/                     # Express routes
├── views/                      # EJS templates
└── public/                     # Static assets
```

## Notes

- Only conversations whose ElevenLabs summary title matches **"Farm Profile Creation"** are converted into profiles; other conversation types (e.g. general assistance calls) are recorded but skipped.
- If a field wasn't mentioned during a call, it's saved as `"Not mentioned"` rather than left blank, to satisfy required schema fields and keep profile data consistent.