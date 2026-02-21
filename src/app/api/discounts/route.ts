import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List discounts (optionally filter by courseId)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const activeOnly = url.searchParams.get('active') !== 'false';

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (activeOnly) {
      where.isActive = true;
      where.endDate = { gte: new Date() };
      where.startDate = { lte: new Date() };
    }

    const discounts = await prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, price: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST: Create a discount
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, percentage, description, endDate } = body;

    if (!percentage || percentage <= 0 || percentage > 100) {
      return NextResponse.json({ error: 'نسبة الخصم يجب أن تكون بين 1 و 100' }, { status: 400 });
    }
    if (!endDate) {
      return NextResponse.json({ error: 'تاريخ الانتهاء مطلوب' }, { status: 400 });
    }

    const role = session.user.role;

    // Admin can create global (courseId=null) or specific discounts for any course
    // Craftsman can only create discounts for their own paid courses
    if (role === 'admin') {
      // Admin can do anything
      if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
        if (course.isFree) return NextResponse.json({ error: 'لا يمكن إنشاء خصم لدورة مجانية' }, { status: 400 });
      }
    } else if (role === 'craftsman') {
      if (!courseId) {
        return NextResponse.json({ error: 'المعلم يمكنه فقط إنشاء خصم لدوراته الخاصة' }, { status: 403 });
      }
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.creatorId !== session.user.id) {
        return NextResponse.json({ error: 'يمكنك فقط إنشاء خصم لدوراتك الخاصة' }, { status: 403 });
      }
      if (course.isFree) {
        return NextResponse.json({ error: 'لا يمكن إنشاء خصم لدورة مجانية' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const discount = await prisma.discount.create({
      data: {
        courseId: courseId || null,
        percentage,
        description: description || null,
        endDate: new Date(endDate),
        createdById: session.user.id,
      },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    // Notify all learners about the discount
    const learners = await prisma.user.findMany({
      where: { role: 'learner' },
      select: { id: true },
    });

    const courseName = discount.course?.title || 'جميع الدورات المدفوعة';
    const notificationData = learners.map(l => ({
      userId: l.id,
      title: '🏷️ خصم جديد!',
      message: `خصم ${percentage}% على ${courseName} حتى ${new Date(endDate).toLocaleDateString('ar-SA')}`,
      type: 'discount',
      link: discount.courseId ? `/courses/${discount.courseId}` : '/courses',
    }));

    if (notificationData.length > 0) {
      await prisma.notification.createMany({ data: notificationData });
    }

    return NextResponse.json({ discount, message: `تم إنشاء الخصم وإشعار ${learners.length} طالب` }, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: Deactivate a discount
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { discountId } = body;

    if (!discountId) {
      return NextResponse.json({ error: 'معرف الخصم مطلوب' }, { status: 400 });
    }

    const discount = await prisma.discount.findUnique({ where: { id: discountId } });
    if (!discount) {
      return NextResponse.json({ error: 'الخصم غير موجود' }, { status: 404 });
    }

    // Admin can delete any, craftsman can delete their own
    if (session.user.role !== 'admin' && discount.createdById !== session.user.id) {
      return NextResponse.json({ error: 'غير مصرح بحذف هذا الخصم' }, { status: 403 });
    }

    await prisma.discount.update({
      where: { id: discountId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'تم إلغاء الخصم' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
