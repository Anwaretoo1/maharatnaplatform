import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-neutral-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-600">لوحة التحكم</h2>
          <p className="text-sm text-gray-500 mt-1">مرحباً، {user.name}</p>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <Link href="/dashboard/learner" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300">
            📚 لوحة المتعلم
          </Link>
          
          {(user.role === 'craftsman' || user.role === 'admin') && (
            <Link href="/dashboard/craftsman" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300">
              🎨 لوحة الحرفي
            </Link>
          )}
          
          {user.role === 'admin' && (
            <Link href="/dashboard/admin" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300">
              ⚙️ لوحة المسؤول
            </Link>
          )}

          <Link href="/dashboard/messages" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300">
            ✉️ الرسائل
          </Link>

          <Link href="/dashboard/settings" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300">
            🔒 تغيير كلمة المرور
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-neutral-800">
            <Link href="/" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300">
              العودة للرئيسية
            </Link>
            <form action="/api/logout" method="POST">
               <button type="submit" className="w-full text-right px-4 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                تسجيل الخروج
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
