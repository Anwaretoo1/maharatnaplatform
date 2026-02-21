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

// POST: Send a new message (or broadcast for admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, subject, content, imageUrl, broadcast } = body;

    // === BROADCAST (admin only) ===
    if (broadcast) {
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'الرسائل الجماعية متاحة للمسؤول فقط' }, { status: 403 });
      }
      if (!content) {
        return NextResponse.json({ error: 'محتوى الرسالة مطلوب' }, { status: 400 });
      }

      // broadcast: 'all' | 'learners' | 'craftsmen'
      const whereFilter: any = { id: { not: session.user.id } };
      if (broadcast === 'learners') whereFilter.role = 'learner';
      else if (broadcast === 'craftsmen') whereFilter.role = 'craftsman';

      const recipients = await prisma.user.findMany({
        where: whereFilter,
        select: { id: true },
      });

      if (recipients.length === 0) {
        return NextResponse.json({ error: 'لا يوجد مستلمون' }, { status: 400 });
      }

      // Create messages in bulk
      const messagesData = recipients.map(r => ({
        senderId: session.user.id,
        receiverId: r.id,
        subject: subject || null,
        content,
        imageUrl: imageUrl || null,
      }));

      await prisma.message.createMany({ data: messagesData });

      // Create notifications in bulk
      const notificationsData = recipients.map(r => ({
        userId: r.id,
        title: 'رسالة جماعية من الإدارة',
        message: `رسالة جديدة من ${session.user.name}: ${subject || content.substring(0, 50)}`,
        type: 'system',
        link: '/dashboard/messages',
      }));

      await prisma.notification.createMany({ data: notificationsData });

      return NextResponse.json({ 
        message: `تم إرسال الرسالة إلى ${recipients.length} مستخدم`,
        count: recipients.length 
      }, { status: 201 });
    }

    // === SINGLE MESSAGE ===
    if (!receiverId || !content) {
      return NextResponse.json({ error: 'المستلم والمحتوى مطلوبان' }, { status: 400 });
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: 'المستخدم المستلم غير موجود' }, { status: 404 });
    }

    const senderRole = session.user.role;

    // === Messaging restrictions ===
    if (senderRole !== 'admin') {
      // Check if sender is blocked by receiver
      const blocked = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: receiverId, blockedId: session.user.id } },
      });
      if (blocked) {
        return NextResponse.json({ error: 'لا يمكنك إرسال رسالة لهذا المستخدم' }, { status: 403 });
      }

      if (senderRole === 'learner') {
        // Learner can message: admin OR teachers of courses they're enrolled in
        if (receiver.role === 'admin') {
          // Always allowed to message admin
        } else if (receiver.role === 'craftsman') {
          // Check if learner is enrolled in any of this teacher's courses
          const enrolledInTeacherCourse = await prisma.enrollment.findFirst({
            where: {
              userId: session.user.id,
              course: { creatorId: receiverId },
            },
          });
          if (!enrolledInTeacherCourse) {
            return NextResponse.json({ error: 'يمكنك فقط مراسلة معلمي الدورات المسجل بها' }, { status: 403 });
          }
        } else {
          // Learner cannot message other learners
          return NextResponse.json({ error: 'لا يمكنك مراسلة هذا المستخدم' }, { status: 403 });
        }
      } else if (senderRole === 'craftsman') {
        // Craftsman can message: admin OR students enrolled in their courses
        if (receiver.role === 'admin') {
          // Always allowed to message admin
        } else if (receiver.role === 'learner') {
          // Check if this student is enrolled in any of this teacher's courses
          const studentInCourse = await prisma.enrollment.findFirst({
            where: {
              userId: receiverId,
              course: { creatorId: session.user.id },
            },
          });
          if (!studentInCourse) {
            return NextResponse.json({ error: 'يمكنك فقط مراسلة الطلاب المسجلين بدوراتك' }, { status: 403 });
          }
        } else {
          // Craftsman cannot message other craftsmen  
          return NextResponse.json({ error: 'لا يمكنك مراسلة هذا المستخدم' }, { status: 403 });
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        subject: subject || null,
        content,
        imageUrl: imageUrl || null,
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
