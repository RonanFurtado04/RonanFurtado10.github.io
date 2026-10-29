(() => {
  const $ = (s) => document.querySelector(s);
  const launcher = $('#ronanAiLauncher');
  const panel = $('#ronan-ai-widget');
  const closeBtn = $('#ronanAiClose');
  const form = $('#ronanAiForm');
  const input = $('#ronanAiInput');
  const log = $('#ronanAiLog');
  const mic = $('#ronanAiMic');
  const send = $('#ronanAiSend');
  const status = $('#ronanAiStatus');
  const mute = $('#ronanAiMute');
  if (!launcher || !panel) return;

  const apiBase = (window.RONAN_AI_API_URL || '').trim().replace(/\/+$/, '') || 'http://localhost:8787';
  let conversation = [];
  let voiceEnabled = true;
  let recognition = null;
  let listening = false;
  let busy = false;

  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    setTimeout(() => input.focus(), 50);
  }
  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
    stopListening();
  }
  launcher.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  function addMessage(text, role) {
    const el = document.createElement('div');
    el.className = 'ai-message ' + (role === 'user' ? 'ai-user' : 'ai-bot');
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function setStatus(message) { status.textContent = message; }
  function speak(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => /en-IN/i.test(v.lang)) || voices.find(v => /English/i.test(v.name));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setStatus('Ronan AI is speaking…');
    utterance.onend = () => setStatus('Ready for your next question.');
    utterance.onerror = () => setStatus('Reply shown as text. Voice is unavailable in this browser.');
    window.speechSynthesis.speak(utterance);
  }

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    addMessage(q, 'user');
    conversation.push({ role: 'user', content: q });
    // Keep a bounded history to control latency and token usage.
    conversation = conversation.slice(-12);
    input.value = '';
    busy = true;
    send.disabled = true;
    setStatus('Thinking…');
    const waiting = addMessage('Thinking…', 'assistant');
    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || `Request failed (${response.status}).`;
        throw new Error(message);
      }
      const answer = String(data.reply || '').trim();
      if (!answer) throw new Error('The assistant returned an empty response.');
      waiting.textContent = answer;
      conversation.push({ role: 'assistant', content: answer });
      conversation = conversation.slice(-12);
      log.scrollTop = log.scrollHeight;
      speak(answer);
      if (!voiceEnabled) setStatus('Reply received. Voice is muted.');
      else if (!('speechSynthesis' in window)) setStatus('Reply received. Speech synthesis is not supported here.');
      else setStatus('Reply received.');
    } catch (error) {
      waiting.textContent = `I couldn't reach the AI service. ${error.message} Check that the backend is running and config.js points to it.`;
      setStatus('Connection issue — check backend setup.');
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  document.querySelectorAll('[data-ai-prompt]').forEach(button => {
    button.addEventListener('click', () => ask(button.getAttribute('data-ai-prompt') || ''));
  });

  function stopListening() {
    if (recognition && listening) {
      try { recognition.stop(); } catch (_) {}
    }
    listening = false;
    mic.classList.remove('listening');
    mic.setAttribute('aria-label', 'Start microphone input');
  }
  mic.addEventListener('click', () => {
    if (listening) { stopListening(); setStatus('Microphone stopped.'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Speech input is not supported in this browser. Try Chrome or type instead.');
      return;
    }
    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        listening = true;
        mic.classList.add('listening');
        mic.setAttribute('aria-label', 'Stop microphone input');
        setStatus('Listening… speak now.');
      };
      recognition.onresult = event => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        input.value = transcript;
        setStatus(transcript ? 'Got it — sending your question…' : 'No speech detected. Try again.');
        if (transcript.trim()) ask(transcript);
      };
      recognition.onerror = event => {
        setStatus(event.error === 'not-allowed' ? 'Microphone permission denied. Allow access in browser settings.' : `Microphone issue: ${event.error}. You can type instead.`);
      };
      recognition.onend = () => {
        listening = false;
        mic.classList.remove('listening');
        mic.setAttribute('aria-label', 'Start microphone input');
      };
      recognition.start();
    } catch (error) {
      setStatus('Could not start microphone. Check permissions or use text input.');
    }
  });

  mute.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    mute.textContent = voiceEnabled ? 'VOICE ON' : 'VOICE OFF';
    mute.setAttribute('aria-pressed', String(!voiceEnabled));
    if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setStatus(voiceEnabled ? 'Spoken replies enabled.' : 'Spoken replies muted.');
  });
})();