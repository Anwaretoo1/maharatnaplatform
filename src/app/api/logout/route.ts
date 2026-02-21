import { NextResponse } from 'next/server';
import { logout } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST() {
  await logout();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return NextResponse.redirect(new URL('/login', `${protocol}://${host}`));
}
