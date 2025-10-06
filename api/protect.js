export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const key = `rate_${ip}`;

  // تخزين بسيط في الذاكرة (مؤقت)
  if (!global.rateLimits) global.rateLimits = {};
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  if (!global.rateLimits[key]) {
    global.rateLimits[key] = { count: 1, start: now };
  } else {
    const record = global.rateLimits[key];
    if (now - record.start < hour) {
      record.count++;
      if (record.count > 10) {
        return res.status(429).json({ status: 'blocked', message: 'Too many requests' });
      }
    } else {
      global.rateLimits[key] = { count: 1, start: now };
    }
  }

  res.status(200).json({ status: 'ok' });
}
