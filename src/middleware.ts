import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function addSecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function validateOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (!origin && !host) return false;
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const allowedOrigins = [
      host,
      'localhost:3000',
      'localhost:3001',
      process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : null,
    ].filter(Boolean);

    return allowedOrigins.includes(originUrl.host);
  } catch {
    return false;
  }
}

// 显式指定 cookie 名，与 authOptions 的 useSecureCookies 保持一致，
// 避免 withAuth 在无 NEXTAUTH_URL 时推断出错误的 cookie 名导致鉴权失败。
const isProduction = process.env.NODE_ENV === 'production';
const sessionCookieName = isProduction
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';

export default async function middleware(req: NextRequest) {
  if (!validateOrigin(req)) {
    return new NextResponse('Forbidden - Invalid Origin', { status: 403 });
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookieName,
  });

  if (!token) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/onboarding/:path*', '/weekly-review/:path*', '/profile/:path*', '/enterprise/:path*', '/admin/:path*'],
};
