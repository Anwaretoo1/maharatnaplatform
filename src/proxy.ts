import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, updateSession } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  if (hostname === 'maharat-syria.com') {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = 'www.maharat-syria.com';
    canonicalUrl.protocol = 'https';
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const session = request.cookies.get('session')?.value;
  const path = request.nextUrl.pathname;

  // Protect dashboard routes
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await decrypt(session);
    } catch (_error) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set({
        name: 'session',
        value: '',
        expires: new Date(0),
        httpOnly: true,
      });
      return response;
    }
  }

  const refreshedSessionResponse = await updateSession(request);
  if (refreshedSessionResponse) {
    return refreshedSessionResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|sw.js|icons).*)',
  ],
};
