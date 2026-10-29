import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';

const app = express();
const PORT = Number(process.env.PORT || 8787);
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || 'http://localhost:8000').split(',').map(s => s.trim()).filter(Boolean);
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5';

if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set. Add it to backend/.env before starting the server.');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // No Origin is common for local command-line health checks.
    if (!origin || FRONTEND_ORIGIN.includes('*') || FRONTEND_ORIGIN.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '24kb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages in a short time. Please wait a minute and try again.' }
});

const SYSTEM_PROMPT = `You are Ronan AI, the friendly conversational voice assistant on Ronan Furtado's personal portfolio website.
Your job is to answer visitors' questions about Ronan, his background, projects, skills, education, and career interests.
Speak naturally and clearly, as if the answer will be read aloud. Prefer concise answers (usually 2-5 sentences), avoid markdown tables, and explain technical topics in plain language when useful.
Use only the profile facts below. Do not invent employers, qualifications, dates, metrics, links, or achievements. If something is not listed, say you don't have that detail and suggest contacting Ronan.
Profile:
- Name: Ronan Furtado.
- Profile: Generative AI Engineer with interests and skills in LLMs, transformers, NLP, computer vision, and AI-powered applications.
- Education: B.Tech in Computer Science (Artificial Intelligence), Manipal Academy of Higher Education, Bengaluru, 2023–2026. Diploma in Electrical and Electronics Engineering, Government Polytechnic Curchorem, Goa, 2020–2023.
- Skills: Python, HTML, CSS, SQL, Pandas, NumPy, Matplotlib, OpenCV, TensorFlow, Scikit-learn, Git, Jupyter Notebook, MATLAB, MySQL, Oracle SQL, deep learning, Generative AI, transformers, embeddings, CNNs, RNNs, and LLM fine-tuning.
- Internship: AI/ML Application Developer Intern at Infotech Corporation of Goa Ltd., Panaji, June–July 2025. Developed an OCR-based AI system using Google ML Kit to extract document serial numbers, reducing manual data-entry time by 70%; helped streamline State Registrar of Goa workflows using a Kotlin Android app, MySQL, and Node.js backend.
- Earlier experience: Production Department Intern at Synegra EMS Ltd., Verna, August–October 2022; exposure to hardware testing, fault diagnosis, electronic component handling, and QA processes for routers and network switches.
- Project: AI-Powered Flight Price Finder (July–September 2025): Python chatbot using Streamlit and LangChain, a simulated real-time data feed, RAG pipeline, Groq-powered Llama 3.1, Hugging Face Transformers, and FAISS.
- Project: Emotion Recognition System (September–December 2024): CNN-based system reported at 87% accuracy on RAVDESS and TESS datasets, with preprocessing for lighting and occlusion challenges; Python, TensorFlow/Keras, OpenCV.
- Project: Document Tracker App: Kotlin Android app using Google ML Kit OCR with Node.js and MySQL backend for document tracking.
- Project: Agentic Recruiting Assistant: Python CLI that compares a job description with public developer profile information.
- Courses: Oracle SQL Databases Specialization (LearnQuest), Machine Learning for Computer Vision (MathWorks), Automating Image Processing (MathWorks).
- Languages: English, Hindi, Konkani.
- Contact details should be taken from the portfolio page; do not repeat the phone number unless specifically asked.
If a visitor asks something unrelated to Ronan, answer briefly if helpful, then steer back to the portfolio. Never claim to be Ronan himself; explain you are his AI portfolio assistant.`;

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ronan-ai-backend' }));

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const raw = req.body?.messages;
    if (!Array.isArray(raw) || raw.length < 1 || raw.length > 12) {
      return res.status(400).json({ error: 'Send between 1 and 12 conversation messages.' });
    }
    const messages = [];
    for (const item of raw) {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') {
        return res.status(400).json({ error: 'Each message must have a valid role and text content.' });
      }
      const content = item.content.trim();
      if (!content || content.length > 1200) {
        return res.status(400).json({ error: 'Each message must contain 1–1200 characters.' });
      }
      messages.push({ role: item.role, content });
    }
    if (messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'The last message must be from the visitor.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'The AI service is not configured yet. Add OPENAI_API_KEY on the backend.' });
    }

    const response = await openai.responses.create({
      model: MODEL,
      instructions: SYSTEM_PROMPT,
      input: messages.map(m => ({ role: m.role, content: m.content })),
      max_output_tokens: 350,
      store: false
    });
    const reply = (response.output_text || '').trim();
    if (!reply) return res.status(502).json({ error: 'The AI service returned no text. Please try again.' });
    res.json({ reply });
  } catch (error) {
    console.error('Chat request failed:', error?.status || '', error?.message || 'Unknown error');
    if (error?.status === 429) return res.status(429).json({ error: 'The AI service is busy or its usage limit has been reached. Try again shortly.' });
    res.status(500).json({ error: 'Ronan AI could not answer just now. Please try again.' });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.message === 'Origin is not allowed by CORS.') return res.status(403).json({ error: err.message });
  console.error('Server middleware error:', err?.message || err);
  res.status(400).json({ error: 'Invalid request.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ronan AI backend listening on port ${PORT}`);
  console.log(`Allowed frontend origins: ${FRONTEND_ORIGIN.join(', ')}`);
});
