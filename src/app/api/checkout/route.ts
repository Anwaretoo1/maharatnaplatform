import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: 'معرّف الدورة مطلوب' }, { status: 400 });
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { creator: { select: { name: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    if (course.isFree) {
      return NextResponse.json({ error: 'هذه الدورة مجانية، سجل مباشرة' }, { status: 400 });
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في هذه الدورة' }, { status: 400 });
    }

    // Get origin for redirect URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session with dynamic price
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: `دورة بواسطة ${course.creator.name}`,
              ...(course.thumbnailUrl ? { images: [course.thumbnailUrl] } : {}),
            },
            unit_amount: Math.round((course.price || 0) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseId: course.id,
        userId: session.user.id,
        courseName: course.title,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/courses/${courseId}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء جلسة الدفع' }, { status: 500 });
  }
}
