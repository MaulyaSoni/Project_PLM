const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_random_secret';
const FRONTEND_URLS = parseCsv(process.env.FRONTEND_URLS);
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

const ALLOWED_ORIGINS = Array.from(
  new Set([...FRONTEND_URLS, DEFAULT_FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080'])
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const parsed = new URL(origin);
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!isHttp) return false;

    // Allow local development hosts on any port (e.g. Vite 8081, 8082...)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;

    // Allow common LAN private ranges for device testing
    if (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)
    ) {
      return true;
    }
  } catch (_error) {
    return false;
  }

  return false;
};

module.exports = {
  PORT,
  JWT_SECRET,
  ALLOWED_ORIGINS,
  isAllowedOrigin,
};
