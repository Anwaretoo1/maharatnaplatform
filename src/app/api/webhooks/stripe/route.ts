import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable body parsing - Stripe needs the raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    // If webhook secret is configured, verify the signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // In development without webhook secret, parse the event directly
      event = JSON.parse(body) as Stripe.Event;
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === 'paid' && session.metadata?.courseId && session.metadata?.userId) {
        const { courseId, userId } = session.metadata;

        // Check if already enrolled (idempotent)
        const existing = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
        });

        if (!existing) {
          await prisma.enrollment.create({
            data: { userId, courseId },
          });
          console.log(`Webhook: Enrolled user ${userId} in course ${courseId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
