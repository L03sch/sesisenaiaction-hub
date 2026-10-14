export function securityHeaders(origin) {
  if (!origin) throw new Error('VITE_SUPABASE_URL is required for production security policy');
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Supabase URL must be an HTTPS origin');
  }
  return {
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://ava.sesisenai.org.br ${url.origin}; connect-src 'self' ${url.origin} wss://${url.host}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000',
  };
}
