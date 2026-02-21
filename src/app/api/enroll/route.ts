import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
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
