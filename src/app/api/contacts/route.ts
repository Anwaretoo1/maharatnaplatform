import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get allowed contacts for messaging based on user role
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    // Get blocked user IDs (users I blocked or who blocked me)
    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.blockedUser.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
      prisma.blockedUser.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
    ]);
    const blockedIds = new Set([
      ...blockedByMe.map(b => b.blockedId),
      ...blockedMe.map(b => b.blockerId),
    ]);

    let contacts: { id: string; name: string; email: string; role: string }[] = [];

    if (role === 'admin') {
      // Admin can message anyone
      const allUsers = await prisma.user.findMany({
        where: { id: { not: userId } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });
      contacts = allUsers;
    } else if (role === 'learner') {
      // Learner: admin + teachers of enrolled courses
      const [admins, enrollments] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true, name: true, email: true, role: true },
        }),
        prisma.enrollment.findMany({
          where: { userId },
          include: { course: { include: { creator: { select: { id: true, name: true, email: true, role: true } } } } },
        }),
      ]);

      const contactMap = new Map<string, typeof contacts[0]>();
      admins.forEach(a => contactMap.set(a.id, a));
      enrollments.forEach(e => {
        if (!contactMap.has(e.course.creator.id) && e.course.creator.id !== userId) {
          contactMap.set(e.course.creator.id, e.course.creator);
        }
      });
      contacts = Array.from(contactMap.values());
    } else if (role === 'craftsman') {
      // Craftsman: admin + students enrolled in my courses
      const [admins, enrollments] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true, name: true, email: true, role: true },
        }),
        prisma.enrollment.findMany({
          where: { course: { creatorId: userId } },
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        }),
      ]);

      const contactMap = new Map<string, typeof contacts[0]>();
      admins.forEach(a => contactMap.set(a.id, a));
      enrollments.forEach(e => {
        if (!contactMap.has(e.user.id) && e.user.id !== userId) {
          contactMap.set(e.user.id, e.user);
        }
      });
      contacts = Array.from(contactMap.values());
    }

    // Filter out blocked users (but don't filter admin contacts for non-admin)
    const filtered = contacts.filter(c => !blockedIds.has(c.id) || c.role === 'admin');

    return NextResponse.json({ contacts: filtered });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
