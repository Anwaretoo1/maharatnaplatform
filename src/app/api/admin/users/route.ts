import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// DELETE - حذف مستخدم
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // لا يمكن حذف نفسك
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
    }

    // حذف كل البيانات المرتبطة بالمستخدم
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.progress.deleteMany({ where: { userId } }),
      prisma.enrollment.deleteMany({ where: { userId } }),
      prisma.courseContent.deleteMany({ where: { course: { creatorId: userId } } }),
      prisma.enrollment.deleteMany({ where: { course: { creatorId: userId } } }),
      prisma.course.deleteMany({ where: { creatorId: userId } }),
      prisma.donation.deleteMany({ where: { recipientId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المستخدم' }, { status: 500 });
  }
}

// PATCH - تعديل دور المستخدم أو إعادة تعيين كلمة المرور
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { userId, action, newRole, newPassword } = await request.json();
    if (!userId || !action) {
      return NextResponse.json({ error: 'معرف المستخدم والإجراء مطلوبان' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'لا يمكنك تعديل حسابك من هنا' }, { status: 400 });
    }

    if (action === 'changeRole') {
      if (!['learner', 'craftsman', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'دور غير صالح' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });
      return NextResponse.json({ message: `تم تغيير الدور إلى ${newRole}` });
    }

    if (action === 'resetPassword') {
      const password = newPassword || 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
      });

      // Send notification to user about password change
      await prisma.notification.create({
        data: {
          userId,
          title: 'تم تغيير كلمة المرور',
          message: `تم تغيير كلمة المرور الخاصة بك بواسطة المسؤول. كلمة المرور الجديدة: ${password}`,
          type: 'password_changed',
        },
      });

      // Send private message with the new password
      await prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId: userId,
          subject: 'تم تغيير كلمة المرور',
          content: `مرحباً،\n\nتم تغيير كلمة المرور الخاصة بحسابك بواسطة المسؤول.\n\nكلمة المرور الجديدة: ${password}\n\nيرجى تغيير كلمة المرور بعد تسجيل الدخول من لوحة التحكم.\n\nمع التحية،\nإدارة منصة مهاراتنا`,
        },
      });

      return NextResponse.json({ message: `تم إعادة تعيين كلمة المرور إلى: ${password}` });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل المستخدم' }, { status: 500 });
  }
}
