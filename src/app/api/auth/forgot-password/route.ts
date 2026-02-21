import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'إذا كان هذا البريد مسجلاً، سيتم إرسال رابط إعادة التعيين إليه.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Send Email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك في منصة مهاراتنا.</p>
        <p>اضغط على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a>
        <p>هذا الرابط صالح لمدة ساعة واحدة.</p>
        <p>إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا البريد.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'إعادة تعيين كلمة المرور - منصة مهاراتنا',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'إذا كان هذا البريد مسجلاً، سيتم إرسال رابط إعادة التعيين إليه.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'حدث خطأ ما' }, { status: 500 });
  }
}
