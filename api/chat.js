
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are Ronan AI, the friendly AI portfolio assistant for Ronan Furtado.
Answer questions about his background, education, skills, experience, and projects.
Speak naturally and concisely, usually in 2-5 sentences.
Never claim to be Ronan himself. Do not invent facts.

Ronan Furtado is a Computer Science (Artificial Intelligence) graduate from Manipal Academy of Higher Education, Bengaluru.

Skills include Python, SQL, Pandas, NumPy, OpenCV, TensorFlow, Scikit-learn, MySQL, deep learning, Generative AI, transformers, embeddings, CNNs, RNNs, and LLM fine-tuning.

Experience:
AI/ML Application Developer Intern at Infotech Corporation of Goa Ltd., Panaji, June-July 2025. Developed an OCR system using Google ML Kit to extract document serial numbers, reducing manual data-entry time by 70%. Worked with a Kotlin Android app, MySQL, and Node.js backend for State Registrar of Goa workflows.
Production Department Intern at Synegra EMS Ltd., Verna, August-October 2022. Exposure to hardware testing, fault diagnosis, electronic components, and QA for routers and network switches.

Projects:
- AI-Powered Flight Price Finder: Python, Streamlit, LangChain, RAG, Groq Llama 3.1, Hugging Face Transformers, and FAISS.
- Emotion Recognition System: CNN with reported 87% accuracy on RAVDESS and TESS datasets, using Python, TensorFlow/Keras, and OpenCV.
- Document Tracker App: Kotlin, Google ML Kit OCR, Node.js, and MySQL.
- Agentic Recruiting Assistant: Python CLI that compares job descriptions with public developer profile information.

Courses: Oracle SQL Databases Specialization, Machine Learning for Computer Vision, and Automating Image Processing.
Languages: English, Hindi, and Konkani.

For missing details, say you don't have that information and suggest contacting Ronan through his portfolio. For unrelated questions, briefly help and steer back to his work.`;

export default async function handler(req, res) {

const allowedOrigins = [
  'https://ronanfurtado04.github.io'
];


const origin = req.headers.origin;

if (origin && !allowedOrigins.includes(origin)) {
  return res.status(403).json({
    error: 'Origin is not allowed.',
    receivedOrigin: origin
  });
}

res.setHeader(
  'Access-Control-Allow-Origin',
  origin || allowedOrigins[0]
);
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Vary', 'Origin');


  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured.' });
  }

  try {
    const raw = req.body?.messages;

    if (!Array.isArray(raw) || raw.length < 1 || raw.length > 12) {
      return res.status(400).json({
        error: 'Send between 1 and 12 conversation messages.'
      });
    }

    const messages = [];

    for (const item of raw) {
      if (
        !item ||
        !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string'
      ) {
        return res.status(400).json({ error: 'Invalid message format.' });
      }

      const content = item.content.trim();

      if (!content || content.length > 1200) {
        return res.status(400).json({
          error: 'Each message must contain 1–1200 characters.'
        });
      }

      messages.push({ role: item.role, content });
    }

    if (messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({
        error: 'The last message must be from the visitor.'
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.5',
      instructions: SYSTEM_PROMPT,
      input: messages,
      max_output_tokens: 350,
      store: false
    });

    const reply = (response.output_text || '').trim();

    if (!reply) {
      return res.status(502).json({ error: 'No response was generated.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Ronan AI error:', error?.status || '', error?.message || '');

    if (error?.status === 429) {
      return res.status(429).json({
        error: 'AI usage limit reached or service is busy. Try again shortly.'
      });
    }

    return res.status(500).json({
      error: 'Ronan AI could not answer just now. Please try again.'
    });
  }
}
