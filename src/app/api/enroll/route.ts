import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, stripeSessionId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Get course to check if paid
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // For paid courses, verify Stripe payment
    if (!course.isFree) {
      if (!stripeSessionId) {
        return NextResponse.json({ error: 'Payment required for this course' }, { status: 402 });
      }

      // Verify the Stripe session
      const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
      
      if (checkoutSession.payment_status !== 'paid') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
      }

      // Verify course and user match
      if (checkoutSession.metadata?.courseId !== courseId || checkoutSession.metadata?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Payment session mismatch' }, { status: 403 });
      }
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ message: 'Already enrolled' });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: courseId
      }
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error enrolling:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
