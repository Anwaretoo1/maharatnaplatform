import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function CraftsmanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const craftsman = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      skills: true,
      avatar: true,
      createdAt: true,
      courses: {
        include: {
          _count: { select: { enrollments: true } },
          content: { select: { id: true } }
        }
      }
    }
  });

  if (!craftsman || craftsman.role !== 'craftsman') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">الحرفي غير موجود</h1>
        <Link href="/craftsmen" className="text-blue-600 hover:underline">العودة لقائمة الحرفيين</Link>
      </main>
    );
  }

  const parsedSkills = craftsman.skills ? JSON.parse(craftsman.skills) : [];
  const totalStudents = craftsman.courses.reduce((sum, c) => sum + c._count.enrollments, 0);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 flex-shrink-0">
            <img
              src={craftsman.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(craftsman.name)}&size=128&background=random`}
              alt={craftsman.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold mb-2">{craftsman.name}</h1>
            <p className="text-blue-200 mb-3">حرفي ومعلم</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {parsedSkills.map((skill: string, i: number) => (
                <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-sm">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 text-center">
            <p className="text-2xl font-bold text-blue-600">{craftsman.courses.length}</p>
            <p className="text-sm text-gray-500">دورة</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 text-center">
            <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
            <p className="text-sm text-gray-500">طالب</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 text-center">
            <p className="text-2xl font-bold text-amber-600">{craftsman.createdAt.toLocaleDateString('ar-SA')}</p>
            <p className="text-sm text-gray-500">تاريخ الانضمام</p>
          </div>
        </div>

        {/* Bio */}
        {craftsman.bio && (
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 mb-8">
            <h2 className="text-xl font-bold mb-3">نبذة تعريفية</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{craftsman.bio}</p>
          </div>
        )}

        {/* Courses */}
        <h2 className="text-2xl font-bold mb-6">الدورات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {craftsman.courses.length > 0 ? (
            craftsman.courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group">
                <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-4xl">📚</div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{course._count.enrollments} طالب · {course.content.length} درس</span>
                      <span className={`font-bold ${course.isFree ? 'text-green-600' : 'text-amber-600'}`}>
                        {course.isFree ? 'مجاني' : `$${course.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              لم ينشر هذا الحرفي أي دورات بعد
            </div>
          )}
        </div>

        {/* Contact for Donation */}
        <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-8 rounded-2xl border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-bold mb-3">ادعم هذا الحرفي</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            يمكنك دعم {craftsman.name} من خلال التواصل مع إدارة المنصة عبر البريد الإلكتروني لتنسيق عملية التبرع.
          </p>
          <a
            href={`mailto:info@maharat-syria.com?subject=تبرع للحرفي ${craftsman.name}&body=أرغب في دعم الحرفي ${craftsman.name}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
          >
            تواصل للتبرع
          </a>
        </div>
      </div>
    </main>
  );
}
