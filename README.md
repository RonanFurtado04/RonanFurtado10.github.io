# Ronan AI Backend

Node.js + Express backend for the Three.js portfolio voice assistant. It keeps the OpenAI API key server-side and provides `POST /api/chat`.

## Requirements
- Node.js 20+
- An OpenAI API key with API billing/usage enabled

## Local setup (macOS)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY` to your own key. Never paste the key into `config.js`, `assistant.js`, or any other frontend file.

Start the API:

```bash
npm start
```

Check it at `http://localhost:8787/health`; it should return `{"ok":true,"service":"ronan-ai-backend"}`.

In another terminal, from the website root, run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. The included `config.js` uses `http://localhost:8787` by default.

## Deploying the frontend + backend

GitHub Pages only hosts static files; it cannot run Node.js. Deploy the `backend/` directory to a Node.js host (for example, Render, Railway, Fly.io, or your own server) and configure these environment variables in that host's dashboard:
- `OPENAI_API_KEY` — secret key, server-side only
- `OPENAI_MODEL` — optional; default `gpt-5.5`
- `FRONTEND_ORIGIN` — your exact published site origin, such as `https://YOUR-USERNAME.github.io`
- `PORT` — usually provided automatically by the host

After deploying, open the host's `/health` endpoint to confirm it is running. Then edit the root `config.js` and set:

```js
window.RONAN_AI_API_URL = "https://YOUR-BACKEND-DOMAIN";
```

Use the exact origin without a trailing slash in `FRONTEND_ORIGIN`. For a project GitHub Pages URL, the origin is still `https://YOUR-USERNAME.github.io` (the repository path is not part of the origin). Redeploy the static site after changing `config.js`.

## Voice behavior

- Microphone input uses the browser Web Speech API. Support varies by browser; Chrome is usually the easiest test. Browser microphone access requires HTTPS or localhost and permission from the visitor.
- Spoken answers use browser `speechSynthesis`; voice availability varies by device and browser.
- The backend uses the OpenAI Responses API for conversational answers, with bounded message history, request size limits, CORS allowlisting, security headers, and basic per-IP rate limiting.
- This is voice input + generated text + browser text-to-speech, not low-latency speech-to-speech. For that, use OpenAI Realtime API with short-lived session credentials from a backend.

## Cost and safety
API calls can incur usage charges. Set usage limits/alerts in your API provider account, do not expose keys, and do not deploy the backend without a suitable abuse-control strategy for a public site.
