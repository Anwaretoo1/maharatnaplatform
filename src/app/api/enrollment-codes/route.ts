import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Generate a random enrollment code
function generateCode(): string {
  return 'MH-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// POST: Create new enrollment code (admin only) OR Redeem code (students)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'generate') {
      // === Admin: Generate enrollment code ===
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'للمسؤول فقط' }, { status: 403 });
      }

      const { courseId, count } = body;
      if (!courseId) {
        return NextResponse.json({ error: 'يجب تحديد الدورة' }, { status: 400 });
      }

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
      }

      const codeCount = Math.min(count || 1, 50); // Max 50 codes at once
      const codes: string[] = [];

      for (let i = 0; i < codeCount; i++) {
        let code = generateCode();
        // Ensure unique
        let exists = await prisma.enrollmentCode.findUnique({ where: { code } });
        while (exists) {
          code = generateCode();
          exists = await prisma.enrollmentCode.findUnique({ where: { code } });
        }

        await prisma.enrollmentCode.create({
          data: { code, courseId },
        });
        codes.push(code);
      }

      return NextResponse.json({
        message: `تم إنشاء ${codes.length} رمز تسجيل لدورة "${course.title}"`,
        codes,
        courseTitle: course.title,
      }, { status: 201 });

    } else if (action === 'redeem') {
      // === Student: Redeem enrollment code ===
      const { code } = body;
      if (!code) {
        return NextResponse.json({ error: 'الرمز مطلوب' }, { status: 400 });
      }

      const enrollmentCode = await prisma.enrollmentCode.findUnique({
        where: { code: code.trim().toUpperCase() },
        include: { course: { select: { id: true, title: true } } },
      });

      if (!enrollmentCode) {
        return NextResponse.json({ error: 'الرمز غير صالح' }, { status: 404 });
      }

      if (enrollmentCode.isUsed) {
        return NextResponse.json({ error: 'هذا الرمز مستخدم بالفعل' }, { status: 400 });
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: enrollmentCode.courseId } },
      });

      if (existingEnrollment) {
        return NextResponse.json({ error: 'أنت مسجل بالفعل في هذه الدورة' }, { status: 400 });
      }

      // Redeem code and enroll atomically
      await prisma.$transaction([
        prisma.enrollmentCode.update({
          where: { id: enrollmentCode.id },
          data: { isUsed: true, usedById: session.user.id, usedAt: new Date() },
        }),
        prisma.enrollment.create({
          data: { userId: session.user.id, courseId: enrollmentCode.courseId },
        }),
      ]);

      return NextResponse.json({
        message: `تم التسجيل بنجاح في دورة "${enrollmentCode.course.title}"`,
        courseId: enrollmentCode.courseId,
        courseTitle: enrollmentCode.course.title,
      });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    console.error('Error with enrollment code:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// GET: List enrollment codes (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'للمسؤول فقط' }, { status: 403 });
    }

    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    const where = courseId ? { courseId } : {};

    const codes = await prisma.enrollmentCode.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
        usedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
