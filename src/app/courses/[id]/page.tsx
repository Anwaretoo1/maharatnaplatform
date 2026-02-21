import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import EnrollButton from './EnrollButton';

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      creator: true,
      content: { select: { id: true, title: true, type: true }, orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } }
    }
  });

  if (!course) {
    return <div className="container mx-auto p-8 text-center">الدورة غير موجودة</div>;
  }

  const session = await getSession();
  let isEnrolled = false;

  if (session) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: id
        }
      }
    });
    isEnrolled = !!enrollment;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-12">
      {/* Hero Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl text-blue-100 mb-6">{course.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span>بواسطة {course.creator.name}</span>
              <span>•</span>
              <span>{course.updatedAt.toLocaleDateString('ar-SA')} آخر تحديث</span>
              <span>•</span>
              <span>{course._count.enrollments} طالب مسجل</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 mb-8 border border-gray-200 dark:border-neutral-800">
              <h2 className="text-2xl font-bold mb-4">محتوى الدورة</h2>
              <div className="space-y-2">
                {course.content.map((item, index) => (
                  <div key={item.id} className="flex items-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-md">
                    <span className="w-8 text-gray-500">{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.type === 'video' ? 'فيديو' : item.type === 'text' ? 'نص' : item.type === 'image' ? 'صورة' : 'ملف'}</p>
                    </div>
                    {isEnrolled ? (
                      <span className="text-green-600 text-sm">متاح</span>
                    ) : (
                      <span className="text-gray-400 text-sm">🔒</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-neutral-800 sticky top-8">
              {course.thumbnailUrl && (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full rounded-md mb-6" />
              )}
              
              <div className="text-3xl font-bold mb-6 text-center">
                {course.isFree ? 'مجاني' : `$${course.price}`}
              </div>

              {isEnrolled ? (
                <Link 
                  href={`/courses/${course.id}/learn`}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white text-center font-bold py-3 px-4 rounded-md transition-colors mb-4"
                >
                  متابعة التعلم
                </Link>
              ) : (
                <EnrollButton courseId={course.id} isLoggedIn={!!session} isFree={course.isFree} price={course.price} />
              )}

              <div className="text-sm text-gray-500 text-center mt-4">
                ضمان استرداد الأموال لمدة 30 يومًا
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
