import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'craftsman' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = id;
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.creatorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.title || !data.type || !data.content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newContent = await prisma.courseContent.create({
      data: {
        courseId,
        title: data.title,
        type: data.type,
        content: data.content,
        order: data.order || 1
      }
    });

    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    console.error('Error adding content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'craftsman' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (course.creatorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete related progress first
    await prisma.progress.deleteMany({ where: { courseContentId: contentId } });
    await prisma.courseContent.delete({ where: { id: contentId } });

    return NextResponse.json({ message: 'تم حذف المحتوى بنجاح' });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
