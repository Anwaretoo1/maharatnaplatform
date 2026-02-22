import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AddContentForm from './AddContentForm';
import DeleteContentButton from './DeleteContentButton';
import DeleteCourseButton from './DeleteCourseButton';

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { content: { orderBy: { order: 'asc' } } }
  });

  if (!course) {
    return <div className="text-center py-12 text-gray-500">الدورة غير موجودة</div>;
  }

  if (course.creatorId !== session.user.id && session.user.role !== 'admin') {
    redirect('/dashboard/craftsman');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">تعديل محتوى الدورة: {course.title}</h1>
        <div className="flex items-center gap-3">
          <a href={`/courses/${course.id}`} target="_blank" className="text-blue-600 hover:underline text-sm">
            معاينة الدورة
          </a>
          <DeleteCourseButton courseId={course.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Content List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">المحتوى الحالي ({course.content.length} درس)</h2>
          {course.content.length > 0 ? (
            course.content.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 dark:bg-neutral-800 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.type === 'video' ? 'فيديو' : item.type === 'text' ? 'نص' : item.type === 'image' ? 'صورة' : 'ملف'}</p>
                  </div>
                </div>
                <DeleteContentButton courseId={course.id} contentId={item.id} />
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
              <p className="text-gray-500">لا يوجد محتوى بعد. أضف أول درس من النموذج المجاور.</p>
            </div>
          )}
        </div>

        {/* Add Content Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-800 sticky top-8">
            <h2 className="text-xl font-semibold mb-4">إضافة محتوى جديد</h2>
            <AddContentForm courseId={course.id} nextOrder={course.content.length + 1} />
          </div>
        </div>
      </div>
    </div>
  );
}
