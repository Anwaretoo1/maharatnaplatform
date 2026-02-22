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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[Forgot Password] User not found: ${email}`);
      return NextResponse.json({ 
        message: 'إذا كان هذا البريد مسجلاً، سيتم إرسال رابط إعادة التعيين إليه.' 
      });
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

    // Determine reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? String(process.env.NEXT_PUBLIC_APP_URL)
      : 'http://localhost:3000';
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    console.log(`[Forgot Password] Generated reset URL: ${resetUrl}`);

    // Prepare email
    const emailHtml = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px 8px 0 0;">
              <h2 style="color: #2563eb; margin: 0;">إعادة تعيين كلمة المرور</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px 0;">أهلاً ${user.name},</p>
              <p style="margin: 0 0 15px 0;">لقد طلبت إعادة تعيين كلمة المرور الخاصة بك في منصة مهاراتنا.</p>
              <p style="margin: 0 0 25px 0;">اضغط على الزر أدناه لتعيين كلمة مرور جديدة:</p>
              
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">إعادة تعيين كلمة المرور</a>
              
              <p style="margin: 25px 0 15px 0; color: #6b7280; font-size: 14px;">أو انسخ الرابط التالي في المتصفح:</p>
              <p style="margin: 0 0 20px 0; padding: 10px; background-color: #f3f4f6; border-radius: 4px; word-break: break-all; color: #1f2937; font-size: 12px;">${resetUrl}</p>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 25px;">
                <p style="margin: 0 0 5px 0; color: #ef4444; font-weight: bold;">⏰ تنبيه مهم:</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">هذا الرابط صالح لمدة <strong>60 دقيقة فقط</strong>.</p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا البريد بأمان. <br/>حسابك آمن تماماً.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">منصة مهاراتنا &copy; 2026 | جميع الحقوق محفوظة</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Send Email
    const emailSent = await sendEmail({
      to: email,
      subject: '🔐 إعادة تعيين كلمة المرور - منصة مهاراتنا',
      html: emailHtml,
    });

    if (!emailSent) {
      console.error(`[Forgot Password] Failed to send email to ${email}`);
      return NextResponse.json({ 
        error: 'فشل إرسال البريد الإلكتروني. يرجى حاول لاحقاً' 
      }, { status: 500 });
    }

    console.log(`[Forgot Password] Email sent successfully to ${email}`);

    return NextResponse.json({ 
      message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد والرسائل غير المهمة.',
      success: true 
    });

  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ ما. يرجى حاول لاحقاً' 
    }, { status: 500 });
  }
}
