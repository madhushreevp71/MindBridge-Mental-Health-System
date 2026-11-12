// Tiny in-memory rate limiter (good enough for a single-process demo).
// Swap for `express-rate-limit` + Redis if you ever run several instances.
function rateLimit({ windowMs = 60_000, max = 20, message = 'Too many attempts. Please wait a minute.' } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset < now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = hits.get(key) && hits.get(key).reset > now ? hits.get(key) : { count: 0, reset: now + windowMs };
    entry.count += 1;
    hits.set(key, entry);
    if (entry.count > max) return res.status(429).json({ error: message });
    next();
  };
}
module.exports = rateLimit;
