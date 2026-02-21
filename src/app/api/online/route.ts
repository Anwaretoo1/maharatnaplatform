import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Update user's lastSeen (called periodically from client)
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating lastSeen:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// GET: Get online users count (users active in last 5 minutes)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineCount = await prisma.user.count({
      where: {
        lastSeen: { gte: fiveMinutesAgo },
      },
    });

    const onlineUsers = session.user.role === 'admin'
      ? await prisma.user.findMany({
          where: { lastSeen: { gte: fiveMinutesAgo } },
          select: { id: true, name: true, role: true, lastSeen: true },
          orderBy: { lastSeen: 'desc' },
        })
      : [];

    return NextResponse.json({ onlineCount, onlineUsers });
  } catch (error) {
    console.error('Error fetching online:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
