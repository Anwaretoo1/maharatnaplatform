import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'معرّف الجلسة مطلوب' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: checkoutSession.payment_status,
      courseId: checkoutSession.metadata?.courseId,
      userId: checkoutSession.metadata?.userId,
      customerEmail: checkoutSession.customer_email,
    });
  } catch (error) {
    console.error('Session status error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق من حالة الدفع' }, { status: 500 });
  }
}
