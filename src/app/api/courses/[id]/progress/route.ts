import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const { contentId, isCompleted } = await request.json();

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    const progress = await prisma.progress.upsert({
      where: {
        userId_courseContentId: {
          userId: session.user.id,
          courseContentId: contentId
        }
      },
      update: {
        isCompleted: isCompleted,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        courseContentId: contentId,
        isCompleted: isCompleted
      }
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
