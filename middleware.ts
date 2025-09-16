import { NextResponse } from 'next/server';

type Counter = { count: number; resetAt: number };
// Module-level store persists between requests in the same runtime
const RATE_LIMIT_STORE: Map<string, Counter> = new Map();

function rateLimit(key: string, max: number, windowMs: number) {
  const store = RATE_LIMIT_STORE;
  const now = Date.now();
  const cur = store.get(key);
  if (!cur || now > cur.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }
  if (cur.count >= max) {
    return { allowed: false, remaining: 0, resetAt: cur.resetAt };
  }
  cur.count += 1;
  store.set(key, cur);
  return { allowed: true, remaining: max - cur.count, resetAt: cur.resetAt };
}

export function middleware(req: Request) {
  const url = new URL(req.url);
  const resHeaders: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=()'
  };
  // Only rate limit modifying API calls
  if (url.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const { allowed, remaining, resetAt } = rateLimit(`${ip}:${url.pathname}:${req.method}`, 60, 60_000);
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          ...resHeaders,
        },
      });
    }
    const next = NextResponse.next();
    Object.entries(resHeaders).forEach(([k, v]) => next.headers.set(k, v));
    next.headers.set('X-RateLimit-Remaining', String(remaining));
    return next;
  }
  const next = NextResponse.next();
  Object.entries(resHeaders).forEach(([k, v]) => next.headers.set(k, v));
  return next;
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
/* istanbul ignore file */
