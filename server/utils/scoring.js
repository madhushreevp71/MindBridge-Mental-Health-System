// Pure scoring helpers (no database) so they are easy to test and reuse.

// ---- Check-in questionnaire (8 items, each 0-3) ----
// Items 0-3 look at low mood (PHQ-style), items 4-7 at anxiety (GAD-style).
// This is a short screening check-in, NOT a diagnostic tool.
const QUESTIONS = [
  { id: 0, scale: 'mood',    text: 'Little interest or pleasure in doing things' },
  { id: 1, scale: 'mood',    text: 'Feeling down, depressed, or hopeless' },
  { id: 2, scale: 'mood',    text: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 3, scale: 'mood',    text: 'Feeling tired or having little energy' },
  { id: 4, scale: 'anxiety', text: 'Feeling nervous, anxious, or on edge' },
  { id: 5, scale: 'anxiety', text: 'Not being able to stop or control worrying' },
  { id: 6, scale: 'anxiety', text: 'Worrying too much about different things' },
  { id: 7, scale: 'anxiety', text: 'Trouble relaxing' }
];
const OPTIONS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
const MAX_TOTAL = QUESTIONS.length * 3; // 24

function severityFor(total) {
  if (total <= 7) return 'mild';
  if (total <= 15) return 'moderate';
  return 'severe';
}

const SEVERITY_COPY = {
  mild: 'Your answers suggest things are mostly steady. Keep up the habits that help you.',
  moderate: 'Your answers suggest a noticeable load. Talking with someone you trust, or a doctor, could help.',
  severe: 'Your answers suggest you are carrying a lot right now. Please consider booking a doctor soon.'
};

function scoreAnswers(answers) {
  const values = QUESTIONS.map(q => Number(answers[q.id] ?? answers[String(q.id)]));
  if (values.some(v => !Number.isInteger(v) || v < 0 || v > 3)) return null;
  const phq = values.slice(0, 4).reduce((a, b) => a + b, 0);
  const gad = values.slice(4).reduce((a, b) => a + b, 0);
  const total = phq + gad;
  const severity = severityFor(total);
  return {
    phq, gad, total, severity,
    percent: Math.round((total / MAX_TOTAL) * 100),
    message: SEVERITY_COPY[severity]
  };
}

// ---- Mood ----
const MOOD_BANDS = [
  { max: 20, label: 'Really low',  message: "That's a heavy one. You don't have to carry it alone — I'm here whenever you want to talk." },
  { max: 40, label: 'Low',         message: 'Low days happen. Be gentle with yourself today.' },
  { max: 60, label: 'Steady',      message: 'Steady is okay. Not every day has to be a high.' },
  { max: 80, label: 'Good',        message: 'Good to hear. Notice what helped today.' },
  { max: 100, label: 'Glowing',    message: 'That is wonderful. Soak it in!' }
];
function moodBand(score) {
  return MOOD_BANDS.find(b => score <= b.max) || MOOD_BANDS[MOOD_BANDS.length - 1];
}

module.exports = { QUESTIONS, OPTIONS, MAX_TOTAL, scoreAnswers, severityFor, moodBand };
