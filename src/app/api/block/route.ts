import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Block a user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { blockedId } = await request.json();
    if (!blockedId) {
      return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });
    }

    // Cannot block admin
    const targetUser = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'لا يمكن حظر المسؤول' }, { status: 403 });
    }

    // Cannot block yourself
    if (blockedId === session.user.id) {
      return NextResponse.json({ error: 'لا يمكنك حظر نفسك' }, { status: 400 });
    }

    // Check if already blocked
    const existing = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
    });

    if (existing) {
      return NextResponse.json({ message: 'المستخدم محظور بالفعل' });
    }

    await prisma.blockedUser.create({
      data: { blockerId: session.user.id, blockedId },
    });

    return NextResponse.json({ message: 'تم حظر المستخدم بنجاح' }, { status: 201 });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { blockedId } = await request.json();
    if (!blockedId) {
      return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });
    }

    await prisma.blockedUser.deleteMany({
      where: { blockerId: session.user.id, blockedId },
    });

    return NextResponse.json({ message: 'تم إلغاء حظر المستخدم بنجاح' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// GET: Get blocked users list
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: session.user.id },
      include: { blocked: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ blockedUsers: blockedUsers.map(b => b.blocked) });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
