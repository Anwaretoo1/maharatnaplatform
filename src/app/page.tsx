// Force rebuild
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDriveImageUrl } from "@/lib/driveUtils";

export default async function Home() {
  const courses = await prisma.course.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: { name: true }
      }
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <div className="relative w-full bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-800 py-12 sm:py-24 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          منصة مهاراتنا
        </h1>
        <p className="text-base sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          نحفظ التراث ونبني المستقبل. منصة رائدة لتوثيق وتعليم الحرف التقليدية السورية ونقلها للأجيال القادمة.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/courses"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105"
          >
            تصفح الدورات
          </Link>
          <Link
            href="/register"
            className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105 dark:bg-transparent dark:text-white dark:border-white dark:hover:bg-white/10"
          >
            انضم إلينا
          </Link>
        </div>
      </div>

      {/* Latest Courses Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
        <h2 className="text-3xl font-bold text-center mb-12">أحدث الدورات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.length > 0 ? (
            courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="h-48 bg-gray-200 dark:bg-neutral-800 relative">
                    {course.thumbnailUrl ? (
                      <img src={getDriveImageUrl(course.thumbnailUrl)} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white dark:bg-black px-2 py-1 rounded text-xs font-bold shadow-sm">
                      {course.isFree ? 'مجاني' : `$${course.price}`}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100 dark:border-neutral-800">
                      <span>{course.creator.name}</span>
                      <span>{course.createdAt.toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              لا توجد دورات متاحة حالياً. كن أول من ينشر دورة!
            </div>
          )}
        </div>
        <div className="text-center mt-12">
          <Link href="/courses" className="text-blue-600 hover:underline font-medium">
            عرض جميع الدورات &larr;
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full bg-gray-50 dark:bg-neutral-900/50 rounded-3xl my-8">
        <h2 className="text-3xl font-bold text-center mb-12">ماذا نقدم؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🎥
            </div>
            <h3 className="text-xl font-bold mb-2">دورات تعليمية</h3>
            <p className="text-gray-600 dark:text-gray-400">
              دروس مسجلة ومباشرة من أمهر الحرفيين لتعلم أصول الصنعة.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🤝
            </div>
            <h3 className="text-xl font-bold mb-2">مجتمع الحرفيين</h3>
            <p className="text-gray-600 dark:text-gray-400">
              تواصل مع الخبراء وتبادل الخبرات في مجتمع متخصص.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🏺
            </div>
            <h3 className="text-xl font-bold mb-2">دعم التراث</h3>
            <p className="text-gray-600 dark:text-gray-400">
              ساهم في الحفاظ على الهوية الثقافية ودعم أصحاب الحرف.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}