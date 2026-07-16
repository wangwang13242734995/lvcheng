import { withAuth } from 'next-auth/middleware';
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

export default withAuth(
  function middleware(req: NextRequest) {
    if (!validateOrigin(req)) {
      return new NextResponse('Forbidden - Invalid Origin', { status: 403 });
    }

    const response = NextResponse.next();
    return addSecurityHeaders(response);
  },
  {
    pages: {
      signIn: '/auth/login',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/onboarding/:path*', '/weekly-review/:path*', '/profile/:path*', '/enterprise/:path*'],
};
