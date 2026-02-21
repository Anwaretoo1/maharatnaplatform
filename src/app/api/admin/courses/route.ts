import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteCourse } from '@/lib/courses';

// DELETE - حذف دورة بصلاحيات المسؤول
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 });
    }

    await deleteCourse(courseId);
    return NextResponse.json({ message: 'تم حذف الدورة بنجاح' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الدورة' }, { status: 500 });
  }
}
