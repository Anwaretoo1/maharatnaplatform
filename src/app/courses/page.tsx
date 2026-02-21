import Link from 'next/link';
import { getAllCourses } from '@/lib/courses';

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <h1 className="text-4xl font-bold mb-12 text-center">الدورات التدريبية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {courses.map((course) => (
          <div key={course.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-neutral-900 dark:border-neutral-800">
            {course.thumbnailUrl && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={course.thumbnailUrl} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  {course.category}
                </span>
                <span className={`text-sm font-bold ${course.isFree ? 'text-green-600' : 'text-amber-600'}`}>
                  {course.isFree ? 'مجاني' : `${course.price} ر.س`}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2">{course.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {course.description}
              </p>
              <Link 
                href={`/courses/${course.id}`} 
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                عرض التفاصيل
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">لا توجد دورات متاحة حالياً.</p>
        </div>
      )}
    </main>
  );
}
