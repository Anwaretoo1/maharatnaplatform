import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LearnerDashboard() {
  const session = await getSession();
  if (!session) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          creator: true,
          content: true, // To calculate progress
        }
      }
    }
  });

  // Calculate progress for each course (mock logic for now, real logic needs Progress table check)
  const coursesWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
    const totalContent = enrollment.course.content.length;
    const completedContent = await prisma.progress.count({
      where: {
        userId: session.user.id,
        content: { courseId: enrollment.course.id },
        isCompleted: true
      }
    });
    
    const progressPercentage = totalContent === 0 ? 0 : Math.round((completedContent / totalContent) * 100);

    return {
      ...enrollment.course,
      progress: progressPercentage
    };
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">لوحة المتعلم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithProgress.length > 0 ? (
          coursesWithProgress.map((course) => (
            <div key={course.id} className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800">
              {course.thumbnailUrl && (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">بواسطة {course.creator.name}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                </div>
                <p className="text-xs text-right mb-4">{course.progress}% مكتمل</p>

                <Link href={`/courses/${course.id}/learn`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                  {course.progress > 0 ? 'متابعة التعلم' : 'ابدأ الدورة'}
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
            <p className="text-gray-500 mb-4">لست مسجلاً في أي دورة حالياً</p>
            <Link href="/courses" className="text-blue-600 hover:underline font-medium">
              تصفح الدورات المتاحة
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
