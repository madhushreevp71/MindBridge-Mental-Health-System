// Companion chat: Claude (tool use, structured output) when an API key exists,
// otherwise a keyword fallback so the app still works offline.
const config = require('../config');
const chats = require('../models/chatModel');

const CRISIS_MSG =
  "I'm really glad you told me. You matter, and you deserve support right now. " +
  'Please reach out to iCall at 9152987821 (India, Mon–Sat 8am–10pm) or your local emergency number. ' +
  'If you are in immediate danger, call emergency services.';

// Always runs, even if the model's own crisis flag misses something.
const CRISIS_RE = /suicid|self[- ]?harm|hurt myself|end it all|end my life|kill myself|don'?t want to (live|be here)|no reason to live|better off (dead|without me)/i;
const crisisCheck = text => CRISIS_RE.test(text);

// ---------- Fallback (no API key) ----------
const FALLBACK = {
  sad: [
    "I hear you. Feeling sad is part of being human. Would you like to try a grounding exercise together?",
    "It takes courage to say that out loud. What's been weighing on your mind?",
    "That sounds heavy. You don't have to figure it all out right now — I'm just here to listen.",
    "I'm sorry you're going through this. Has something specific happened, or has it been building up?",
    "What's one small thing that has helped you feel even slightly better before?"
  ],
  anxious: [
    "Anxiety can feel overwhelming, but it does pass. Want to try a slow breathing round with me?",
    "You're safe right now. Breathe in for 4, hold for 4, out for 6. How does that feel?",
    "That racing feeling is exhausting. Is there one thought that keeps looping?",
    "When anxiety spikes it helps to come back to the body. Can you feel your feet on the floor?"
  ],
  stressed: [
    "Stress often means something matters to you. What's the main source today?",
    "Let's shrink it. What's the one smallest thing you could do next?",
    "That's a lot to carry at once. Have you been able to rest at all today?",
    "What would taking just ten minutes for yourself look like?"
  ],
  happy: [
    "That's lovely to hear! What's behind the good mood today?",
    "I'm really glad. Positive moments deserve to be noticed — tell me more!",
    "Nice. What's been the best part of your day so far?"
  ],
  neutral: [
    "Thanks for sharing that. Tell me more — I'm listening.",
    "I appreciate you opening up. How long have you been feeling this way?",
    "What kind of support would feel most helpful right now?",
    "I'm here. What's been on your mind today?"
  ]
};

function fallbackSentiment(text) {
  const t = text.toLowerCase();
  if (/sad|depress|cry|unhappy|lonely|down|empty/.test(t)) return 'sad';
  if (/anxi|worry|panic|nervous|scared|afraid/.test(t)) return 'anxious';
  if (/stress|overwhelm|pressure|exam|deadline|burn/.test(t)) return 'stressed';
  if (/happy|good|great|wonderful|excited|joy|proud/.test(t)) return 'happy';
  return 'neutral';
}

function fallbackReply(text, history) {
  const sentiment = fallbackSentiment(text);
  const recent = history.filter(m => m.sender === 'bot').slice(-6).map(m => m.body);
  const pool = FALLBACK[sentiment];
  const fresh = pool.filter(l => !recent.includes(l));
  const choices = fresh.length ? fresh : pool;
  return { sentiment, reply: choices[Math.floor(Math.random() * choices.length)], crisis: false };
}

// ---------- Claude path ----------
let client = null;
if (config.ai.apiKey) {
  const Anthropic = require('@anthropic-ai/sdk');
  client = new Anthropic({ apiKey: config.ai.apiKey });
}

const RESPOND_TOOL = {
  name: 'respond_to_student',
  description: 'Classify the emotional tone of a student message and write a short, warm reply.',
  input_schema: {
    type: 'object',
    properties: {
      sentiment: { type: 'string', enum: ['sad', 'anxious', 'stressed', 'happy', 'neutral'] },
      crisis: { type: 'boolean', description: 'True if the message hints at self-harm or suicide.' },
      reply: { type: 'string', description: '1-3 warm sentences. No diagnosis, no medical advice.' }
    },
    required: ['sentiment', 'crisis', 'reply']
  }
};

const SYSTEM_PROMPT = `You are a gentle, non-judgmental wellbeing companion for students using MindBridge.
You are not a therapist: never diagnose, prescribe or give clinical advice.
Keep replies to 1-3 warm, validating sentences and invite the student to say more.
Always answer by calling the respond_to_student tool.`;

async function llmReply(text, history) {
  const turns = history.slice(-8).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.body }));
  const res = await client.messages.create({
    model: config.ai.model,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    tools: [RESPOND_TOOL],
    tool_choice: { type: 'tool', name: 'respond_to_student' },
    messages: [...turns, { role: 'user', content: text }]
  });
  const block = res.content.find(b => b.type === 'tool_use');
  if (!block) throw new Error('Model did not return structured output.');
  return block.input;
}

// What the UI should offer next, based on how the student seems to feel.
const SUGGESTIONS = {
  sad:      [{ label: 'Log my mood', action: 'mood' }, { label: 'Take the check-in', action: 'checkin' }],
  anxious:  [{ label: 'Try guided breathing', action: 'breathe' }, { label: 'Take the check-in', action: 'checkin' }],
  stressed: [{ label: 'Try guided breathing', action: 'breathe' }, { label: 'See my self-care list', action: 'selfcare' }],
  happy:    [{ label: 'Log this mood', action: 'mood' }],
  neutral:  []
};

async function sendMessage(userId, text) {
  const history = await chats.recent(userId, 12);
  await chats.add({ userId, sender: 'user', body: text });

  let result, source = 'fallback';
  if (client) {
    try { result = await llmReply(text, history); source = 'llm'; }
    catch (e) { console.error('Claude call failed, using fallback:', e.message); }
  }
  if (!result) result = fallbackReply(text, history);

  const crisis = Boolean(result.crisis) || crisisCheck(text);
  // A canned keyword reply right before a crisis message feels dismissive, so in
  // fallback mode a crisis message gets only the safety message.
  const showReply = !(crisis && source === 'fallback');
  const now = () => new Date().toISOString();
  const replies = [];
  if (showReply) {
    await chats.add({ userId, sender: 'bot', body: result.reply, sentiment: result.sentiment, source });
    replies.push({ sender: 'bot', text: result.reply, sentiment: result.sentiment, date: now() });
  }
  if (crisis) {
    await chats.add({ userId, sender: 'bot', body: CRISIS_MSG, sentiment: 'sad', crisis: true });
    replies.push({ sender: 'bot', text: CRISIS_MSG, crisis: true, date: now() });
  }

  return {
    replies,
    sentiment: crisis ? 'sad' : result.sentiment,
    crisis,
    source,
    suggestions: crisis ? [] : SUGGESTIONS[result.sentiment] || []
  };
}

module.exports = { sendMessage, crisisCheck };
