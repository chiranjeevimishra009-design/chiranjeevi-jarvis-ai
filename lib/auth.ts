import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  };
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload.sub as string;
}

export function parseSessionCookieFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      const index = trimmed.indexOf('=');
      return index >= 0 ? [[trimmed.slice(0, index), trimmed.slice(index + 1)]] : [];
    })
  );

  return cookies.session as string | undefined;
}

export async function getSessionUser(req: Request) {
  const token = parseSessionCookieFromRequest(req);
  if (!token) return null;

  try {
    const userId = await verifySessionToken(token);
    const { prisma } = await import('@/lib/db');
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch (error) {
    return null;
  }
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set('session', '', {
    ...getCookieOptions(),
    maxAge: 0
  });
  return response;
}
