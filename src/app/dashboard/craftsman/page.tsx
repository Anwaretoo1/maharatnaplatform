import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DiscountManager } from '@/app/dashboard/admin/AdminActions';

export default async function CraftsmanDashboard() {
  const session = await getSession();
  if (!session) return null;

  if (session.user.role !== 'craftsman' && session.user.role !== 'admin') {
    redirect('/dashboard/learner');
  }

  const myCourses = await prisma.course.findMany({
    where: { creatorId: session.user.id },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">لوحة الحرفي</h1>
        <div className="flex flex-wrap gap-2">
          <DiscountManager courses={myCourses.map(c => ({ id: c.id, title: c.title, isFree: c.isFree, price: c.price }))} role="craftsman" />
          <Link href="/dashboard/craftsman/courses/new" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
            + إنشاء دورة جديدة
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myCourses.length > 0 ? (
          myCourses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800">
              {course.thumbnailUrl && (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>{course.isFree ? 'مجاني' : `$${course.price}`}</span>
                  <span>{course._count.enrollments} طالب</span>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/dashboard/craftsman/courses/${course.id}/edit`} className="flex-1 text-center bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors">
                    تعديل
                  </Link>
                  <Link href={`/courses/${course.id}`} className="flex-1 text-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded-md transition-colors">
                    عرض
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
            <p className="text-gray-500 mb-4">لم تقم بإنشاء أي دورات بعد</p>
            <Link href="/dashboard/craftsman/courses/new" className="text-green-600 hover:underline font-medium">
              ابدأ بإنشاء دورتك الأولى
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
