const TIPS = [
  { kind: 'tip', text: 'Try 4-7-8 breathing: in for 4, hold for 7, out for 8. Three rounds can calm a racing mind.' },
  { kind: 'tip', text: 'A 10-minute walk in daylight can lift your mood and help you sleep better tonight.' },
  { kind: 'tip', text: 'Write down three things that went okay today — small ones count.' },
  { kind: 'tip', text: 'Put screens down an hour before bed. Your sleep will thank you.' },
  { kind: 'tip', text: 'Break the big task into a 10-minute first step. Starting is the hardest part.' },
  { kind: 'tip', text: 'Drink some water and eat something. Mood and basics are more connected than we think.' },
  { kind: 'quote', text: "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, or anxious.", by: 'Lori Deschene' },
  { kind: 'quote', text: 'Self-care is how you take your power back.', by: 'Lalah Delia' },
  { kind: 'quote', text: 'You are allowed to be both a masterpiece and a work in progress.', by: 'Sophia Bush' }
];

// GET /api/tips -> 3 random items
exports.random = (req, res) => {
  const picks = [...TIPS].sort(() => Math.random() - 0.5).slice(0, 3);
  res.json({ tips: picks });
};
