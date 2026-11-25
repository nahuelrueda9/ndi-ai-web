import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Si la consulta viene desde el dominio de la barbería
  if (host.includes('eddubarber.com')) {
    // Si entran a la raíz "/", los reescribimos internamente a "/eddubarber"
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/eddubarber', request.url));
    }
    
    // Si entran a una subruta que no empiece con /eddubarber, la redirigimos dentro de eddubarber
    if (!pathname.startsWith('/eddubarber') && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      return NextResponse.rewrite(new URL(`/eddubarber${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};