const buckets = new Map();

const rateLimit = ({ windowMs = 60_000, max = 60, message = 'Too many requests. Please try again later.' } = {}) => {
  return (req, res, next) => {
    const identity = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const key = `${identity}:${req.baseUrl || ''}:${req.path || ''}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      bucket = { count: 0, expiresAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.expiresAt / 1000)));
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.expiresAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    if (buckets.size > 10_000) {
      for (const [entryKey, entry] of buckets) if (entry.expiresAt <= now) buckets.delete(entryKey);
    }
    return next();
  };
};

module.exports = rateLimit;
