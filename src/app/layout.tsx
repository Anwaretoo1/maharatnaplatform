import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "منصة مهاراتنا - تحويل المهارات التقليدية إلى محتوى رقمي",
  description: "منصة لتحويل المهارات التقليدية السورية إلى محتوى رقمي وتعليمي",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const user = session?.user;

  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600">
                  مهاراتنا
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:space-x-reverse">
                  <Link href="/courses" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    الدورات
                  </Link>
                  <Link href="/craftsmen" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    الحرفيون
                  </Link>
                  <Link href="/donations" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    تبرع
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Link href="/dashboard/learner" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm font-medium">
                      لوحة التحكم
                    </Link>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {user.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{user.name}</span>
                    </div>
                    <form action="/api/logout" method="POST">
                      <button type="submit" className="text-red-500 hover:text-red-700 text-sm font-medium">
                        خروج
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      تسجيل الدخول
                    </Link>
                    <Link href="/register" className="border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-md text-sm font-medium">
                      حساب جديد
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        {children}
        <footer className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">منصة مهاراتنا</h3>
                <p className="text-gray-500 text-sm">منصة رائدة لتوثيق وتعليم الحرف التقليدية السورية ونقلها للأجيال القادمة.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">روابط سريعة</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><Link href="/courses" className="hover:text-blue-600">الدورات</Link></li>
                  <li><Link href="/craftsmen" className="hover:text-blue-600">الحرفيون</Link></li>
                  <li><Link href="/donations" className="hover:text-blue-600">التبرعات</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">تواصل معنا</h3>
                <p className="text-gray-500 text-sm">info@maharat-syria.com</p>
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm border-t border-gray-200 dark:border-neutral-800 pt-6">
              <p>&copy; {new Date().getFullYear()} منصة مهاراتنا. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
