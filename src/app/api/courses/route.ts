import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses, getCourseById, createCourse, deleteCourse } from '@/lib/courses';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const creatorId = searchParams.get('creatorId');
    const isFreeParam = searchParams.get('isFree');
    
    if (id) {
      // Get specific course by ID
      const course = await getCourseById(id);
      
      if (!course) {
        return NextResponse.json(
          { error: 'الدورة غير موجودة' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ course });
    }
    
    // Get all courses with optional filters
    const filters: {
      category?: string;
      creatorId?: string;
      isFree?: boolean;
    } = {};
    
    if (category) filters.category = category;
    if (creatorId) filters.creatorId = creatorId;
    if (isFreeParam !== null) filters.isFree = isFreeParam === 'true';
    
    const courses = await getAllCourses(filters);
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error in courses GET route:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الدورات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'craftsman' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.category) {
      return NextResponse.json(
        { error: 'العنوان والوصف والتصنيف مطلوبة' },
        { status: 400 }
      );
    }
    
    // Create new course
    const newCourse = await createCourse({
      title: data.title,
      description: data.description,
      category: data.category,
      creatorId: session.user.id,
      thumbnailUrl: data.thumbnailUrl || '',
      content: [], // Content added separately
      isFree: data.isFree || false,
      price: data.price || 0,
    });

    // Send notification to all users about the new course
    const allUsers = await prisma.user.findMany({
      where: { id: { not: session.user.id } },
      select: { id: true },
    });

    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          title: 'دورة جديدة',
          message: `تم إضافة دورة جديدة: "${data.title}" بواسطة ${session.user.name}`,
          type: 'new_course',
          link: `/courses/${newCourse.id}`,
        })),
      });
    }
    
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error in courses POST route:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الدورة' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'craftsman' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرّف الدورة مطلوب' }, { status: 400 });
    }

    const course = await getCourseById(id);
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    if (course.creatorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteCourse(id);
    return NextResponse.json({ message: 'تم حذف الدورة بنجاح' });
  } catch (error) {
    console.error('Error in courses DELETE route:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الدورة' },
      { status: 500 }
    );
  }
}
