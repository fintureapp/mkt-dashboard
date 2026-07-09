import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};

const REALM = 'Marketing BI';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function middleware(req: NextRequest) {
  // Link público (sem login) da Visão Geral: só o token exato dispensa o basic
  // auth. Token ausente/errado cai no fluxo normal de auth (fail-closed), então
  // /publico/* fica escondido atrás de login enquanto PUBLIC_SHARE_TOKEN não bater.
  const shareToken = process.env.PUBLIC_SHARE_TOKEN;
  if (shareToken && req.nextUrl.pathname.startsWith('/publico/')) {
    const supplied = req.nextUrl.pathname.split('/')[2] ?? '';
    if (timingSafeEqual(supplied, shareToken)) {
      return NextResponse.next();
    }
  }

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return new NextResponse('Server misconfigured: BASIC_AUTH_* missing', { status: 500 });
  }

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    let decoded: string;
    try {
      decoded = atob(header.slice(6));
    } catch {
      return unauthorized();
    }
    const idx = decoded.indexOf(':');
    if (idx !== -1) {
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (timingSafeEqual(user, expectedUser) && timingSafeEqual(pass, expectedPass)) {
        return NextResponse.next();
      }
    }
  }

  return unauthorized();
}

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` },
  });
}
