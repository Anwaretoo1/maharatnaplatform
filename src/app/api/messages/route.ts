import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get messages for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'received'; // 'received' | 'sent'

    const where = type === 'sent'
      ? { senderId: session.user.id }
      : { receiverId: session.user.id };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      take: 100,
    });

    const unreadCount = await prisma.message.count({
      where: { receiverId: session.user.id, isRead: false },
    });

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, subject, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'المستلم والمحتوى مطلوبان' }, { status: 400 });
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: 'المستخدم المستلم غير موجود' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        subject: subject || null,
        content,
      },
    });

    // Also create a notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'رسالة جديدة',
        message: `لديك رسالة جديدة من ${session.user.name}`,
        type: 'system',
        link: '/dashboard/messages',
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// PATCH: Mark message as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, markAll } = body;

    if (markAll) {
      await prisma.message.updateMany({
        where: { receiverId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (messageId) {
      await prisma.message.update({
        where: { id: messageId, receiverId: session.user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
