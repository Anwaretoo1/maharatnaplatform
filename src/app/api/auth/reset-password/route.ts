import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findUnique({
      where: { resetToken: resetTokenHash },
    });

    if (!user) {
      return NextResponse.json({ error: 'الرابط غير صالح أو منتهي الصلاحية' }, { status: 400 });
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'الرابط منتهي الصلاحية' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: 'تم تغيير كلمة المرور بنجاح' });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'حدث خطأ ما' }, { status: 500 });
  }
}
