# FarmLink

FarmLink is an AI-powered agricultural voice platform that connects farmers with vendors and buyers. Instead of requiring farmers to fill out forms or interact with a conventional chatbot, FarmLink allows them to communicate through a natural phone conversation with an AI agricultural assistant.

The voice interface is powered by **ElevenLabs Conversational AI**, while the reasoning and agricultural response generation are handled by a custom fine-tuned **AgriAssist-2B** language model. The model is served locally using **vLLM** and exposed securely to the ElevenLabs agent through a **Cloudflare Tunnel**.

Farmer information and conversation data are persisted in **MongoDB** for use by the FarmLink web application.

---

## Architecture

```text
                    ┌─────────────────────────┐
                    │         Farmer          │
                    │     Phone Conversation  │
                    └────────────┬────────────┘
                                 │
                                 │ Voice
                                 ▼
                    ┌─────────────────────────────┐
                    │   ElevenLabs Conversational │
                    │           AI Agent          │
                    │                             │
                    │  Speech Recognition         │
                    │  Conversation Management    │
                    │  Text-to-Speech             │
                    └────────────┬────────────────┘
                                 │
                                 │ LLM Request
                                 ▼
                    ┌─────────────────────────┐
                    │      Cloudflare Tunnel  │
                    │                         │
                    │ https://<tunnel-url>    │
                    │          ↓              │
                    │ http://localhost:8000   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │          vLLM           │
                    │                         │
                    │   AgriAssist-2B         │
                    │   BF16 Inference        │
                    │   Context: 512 tokens   │
                    └────────────┬────────────┘
                                 │
                                 │ Generated response
                                 ▼
                    ┌─────────────────────────┐
                    │   ElevenLabs Agent      │
                    │                         │
                    │    Text → Speech        │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │         Farmer          │
                    │     Voice Response      │
                    └─────────────────────────┘


        Conversation / Profile Persistence
                         │
                         ▼
                ┌─────────────────┐
                │     MongoDB     │
                │                 │
                │ Farmer Profiles │
                │ Conversations   │
                │ Sync Metadata   │
                └─────────────────┘
```

---

## How It Works

The system follows a local-LLM-powered voice agent architecture.

### 1. Farmer initiates a call

A farmer interacts with the FarmLink AI agent through a voice conversation.

ElevenLabs handles the voice interface, including speech recognition, conversation orchestration, and text-to-speech.

### 2. ElevenLabs sends the agent's LLM request

Instead of relying on a hosted general-purpose LLM, the ElevenLabs agent is configured to use the FarmLink agricultural language model.

The model used by the agent is:

**[`abhirud/AgriAssist-2B`](https://huggingface.co/abhirud/AgriAssist-2B)**

AgriAssist-2B is a lightweight agricultural language model fine-tuned for Indian farming-related conversations. The model is based on the Gemma 2 2B family and was fine-tuned using QLoRA/Unsloth on an India-focused agricultural dataset.

### 3. The model runs locally using vLLM

The model is loaded locally and served as an OpenAI-compatible inference endpoint using vLLM.

The inference server is configured as:

```bash
vllm serve abhirud/AgriAssist-2B \
    --host 0.0.0.0 \
    --port 8000 \
    --dtype bfloat16 \
    --max-model-len 512 \
    --gpu-memory-utilization 0.85 \
    --enforce-eager
```

This allows the agricultural LLM to run on the local NVIDIA GPU instead of relying on a hosted inference provider.

### 4. Local endpoint is exposed through Cloudflare Tunnel

The vLLM server runs locally at:

```text
http://localhost:8000
```

Since the ElevenLabs service needs to reach the LLM endpoint externally, the local server is exposed through Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:8000
```

This creates a publicly reachable HTTPS endpoint that forwards requests to the local vLLM server.

The resulting flow is:

```text
ElevenLabs
     │
     ▼
Cloudflare Tunnel
     │
     ▼
localhost:8000
     │
     ▼
vLLM
     │
     ▼
AgriAssist-2B
```

The tunnel URL should **never be hard-coded into the repository**. It should be configured in the ElevenLabs agent or deployment configuration.

---

## AgriAssist-2B

AgriAssist-2B is the language model responsible for generating the agricultural responses during the conversation.

### Model characteristics

* **Model:** `abhirud/AgriAssist-2B`
* **Base architecture:** Gemma 2 2B
* **Domain:** Indian agriculture
* **Languages:** Hindi and English
* **Fine-tuning:** QLoRA / supervised fine-tuning
* **Training framework:** Unsloth + Hugging Face Transformers + TRL
* **Inference:** vLLM
* **Precision:** BF16
* **Maximum context configured for deployment:** 512 tokens

The model was fine-tuned on agricultural conversations filtered toward Indian farming use cases. The model card describes capabilities including crop cultivation, pest and disease queries, nutrient deficiencies, irrigation, fertilizer application, and regional agricultural guidance.

---

## Voice Agent

ElevenLabs provides the conversational voice layer.

The voice agent is responsible for:

* Receiving the farmer's speech
* Converting speech into text
* Maintaining the conversation
* Sending the relevant prompt/context to the LLM
* Receiving the generated response
* Converting the response back into speech
* Continuing the conversation naturally

This separates the system into two major layers:

```text
VOICE LAYER
───────────
ElevenLabs Conversational AI
        │
        ▼
Speech ↔ Text


INTELLIGENCE LAYER
──────────────────
AgriAssist-2B
        │
        ▼
Agricultural reasoning + response generation
```

This architecture allows the voice system and the agricultural LLM to be developed independently.

---

## Conversation & Farmer Data

MongoDB is used as the persistence layer for FarmLink.

The application stores farmer profile information and tracks processed ElevenLabs conversations.

Each conversation is associated with its ElevenLabs `conversation_id`.

This prevents the synchronization process from creating duplicate records when previously processed conversations are encountered.

---

## Conversation Synchronization

The project includes:

```bash
node syncNewConversations.js
```

The synchronization process:

1. Connects to MongoDB.
2. Retrieves conversations from the ElevenLabs API.
3. Checks whether each `conversation_id` has already been processed.
4. Processes new conversations.
5. Stores the required conversation/profile information in MongoDB.
6. Records synchronization state to prevent duplicate processing.

The synchronization script can be executed manually or integrated into the application's scheduled workflow.

---

## Web Application

The FarmLink web application provides a traditional interface for accessing farmer information alongside the voice-based workflow.

### Backend

* Node.js
* Express
* JWT authentication
* Cookie-based authentication

### Frontend

* EJS
* HTML/CSS/JavaScript

### Database

* MongoDB
* Mongoose

The web application and voice agent therefore provide two different interfaces to the same agricultural platform:

```text
                   FarmLink
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
       Web Interface       Voice Interface
             │                 │
          EJS UI          ElevenLabs AI
             │                 │
             └────────┬────────┘
                      │
                      ▼
                  MongoDB
```

---

## Technology Stack

| Component           | Technology                   |
| ------------------- | ---------------------------- |
| Voice AI            | ElevenLabs Conversational AI |
| LLM                 | AgriAssist-2B                |
| Model Hosting       | vLLM                         |
| Model Training      | Unsloth + Transformers + TRL |
| Model Fine-tuning   | QLoRA / SFT                  |
| GPU Inference       | NVIDIA CUDA                  |
| Public LLM Endpoint | Cloudflare Tunnel            |
| Backend             | Node.js + Express            |
| Frontend            | EJS                          |
| Database            | MongoDB + Mongoose           |
| Authentication      | JWT + Cookies                |
| Conversation API    | ElevenLabs API               |
| Model Repository    | Hugging Face                 |

---

## 📁 Project Structure

```text
Parippu-Vadai/
│
├── node-express-jwt-auth/
│   │
│   ├── app.js
│   │
│   ├── syncNewConversations.js
│   │
│   ├── controllers/
│   │   └── ...
│   │
│   ├── middleware/
│   │   └── ...
│   │
│   ├── models/
│   │   ├── Email.js
│   │   ├── SyncedConversation.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   └── ...
│   │
│   ├── views/
│   │   └── ...
│   │
│   └── public/
│       └── ...
│
└── README.md
```

---

## Setup

## 1. Clone the repository

```bash
git clone https://github.com/Sethuvishnu/Parippu-Vadai.git
cd Parippu-Vadai/node-express-jwt-auth
```

Install the Node.js dependencies:

```bash
npm install
```

---

## 2. Configure environment variables

Create a `.env` file:

```env
MONGODB=your_mongodb_connection_string

ELEVENLABS_API_KEY=your_elevenlabs_api_key

ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

Never commit API keys or credentials to Git.

---

## Running the LLM Server

Install the required Python dependencies and ensure that the NVIDIA GPU and CUDA environment are configured correctly.

Start the model using:

```bash
vllm serve abhirud/AgriAssist-2B \
    --host 0.0.0.0 \
    --port 8000 \
    --dtype bfloat16 \
    --max-model-len 512 \
    --gpu-memory-utilization 0.85 \
    --enforce-eager
```

The local inference server will then be available at:

```text
http://localhost:8000
```

---

## Expose the LLM Endpoint

In a separate terminal:

```bash
cloudflared tunnel --url http://localhost:8000
```

Cloudflare will provide an HTTPS URL similar to:

```text
https://xxxxxxxx.trycloudflare.com
```

Configure this URL as the LLM endpoint used by the ElevenLabs conversational agent.

> **Important:** The Cloudflare URL shown by Quick Tunnels can change when the tunnel is restarted. For a stable production deployment, use a persistent Cloudflare Tunnel rather than relying on a temporary Quick Tunnel.

---

## Running FarmLink

Start the Express application:

```bash
nodemon app
```

The web application will be available at:

```text
http://localhost:3000
```

The complete development environment consists of three services:

### Terminal 1 — LLM

```bash
vllm serve abhirud/AgriAssist-2B \
    --host 0.0.0.0 \
    --port 8000 \
    --dtype bfloat16 \
    --max-model-len 512 \
    --gpu-memory-utilization 0.85 \
    --enforce-eager
```

### Terminal 2 — Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:8000
```

### Terminal 3 — FarmLink Backend

```bash
nodemon app
```

ElevenLabs then communicates with the publicly exposed vLLM endpoint.

---

# Complete End-to-End Workflow

```text
┌──────────────────┐
│      FARMER      │
│                  │
│  Phone / Voice   │
└────────┬─────────┘
         │
         │ Speech
         ▼
┌──────────────────────────┐
│ ElevenLabs Conversational│
│          AI Agent        │
└────────────┬─────────────┘
             │
             │ LLM Request
             ▼
┌──────────────────────────┐
│    Cloudflare Tunnel     │
│                          │
│  Public HTTPS Endpoint   │
└────────────┬─────────────┘
             │
             │ HTTP
             ▼
┌──────────────────────────┐
│          vLLM            │
│                          │
│   localhost:8000         │
└────────────┬─────────────┘
             │
             │ Inference
             ▼
┌──────────────────────────┐
│      AgriAssist-2B       │
│                          │
│ Fine-tuned Agriculture   │
│       LLM                │
└────────────┬─────────────┘
             │
             │ Response
             ▼
┌──────────────────────────┐
│ ElevenLabs Conversational│
│          AI Agent        │
└────────────┬─────────────┘
             │
             │ Text → Speech
             ▼
┌──────────────────┐
│      FARMER      │
│                  │
│ Voice Response   │
└──────────────────┘

             │
             │ Conversation Data
             ▼
      ┌─────────────┐
      │   MongoDB   │
      └─────────────┘
```
