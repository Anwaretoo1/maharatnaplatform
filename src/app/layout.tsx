import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import OnlineTracker from "./components/OnlineTracker";
import NotificationBell from "./components/NotificationBell";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import MobileUserMenu from "./components/MobileUserMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "منصة مهاراتنا - تحويل المهارات التقليدية إلى محتوى رقمي",
  description: "منصة مهاراتنا تُحوّل المهارات التقليدية السورية إلى دورات تعليمية رقمية. تعلّم الحرف اليدوية، الطهي، النسيج، والفنون التراثية من أمهر الحرفيين السوريين.",
  keywords: ["مهاراتنا", "دورات تعليمية", "حرف يدوية", "تراث سوري", "تعلم أونلاين", "مهارات", "سوريا"],
  authors: [{ name: "منصة مهاراتنا" }],
  creator: "منصة مهاراتنا",
  metadataBase: new URL("https://www.maharat-syria.com"),
  manifest: "/manifest.json",
  openGraph: {
    title: "منصة مهاراتنا - تحويل المهارات التقليدية إلى محتوى رقمي",
    description: "تعلّم الحرف التقليدية السورية من أمهر الحرفيين عبر دورات تعليمية رقمية.",
    url: "https://www.maharat-syria.com",
    siteName: "مهاراتنا",
    locale: "ar_SY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة مهاراتنا",
    description: "تعلّم الحرف التقليدية السورية أونلاين",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مهاراتنا",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* JSON-LD Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "منصة مهاراتنا",
              "alternateName": "Maharatna Platform",
              "url": "https://www.maharat-syria.com",
              "logo": "https://www.maharat-syria.com/icons/icon-192x192.png",
              "description": "منصة تعليمية عربية متخصصة في الحرف التقليدية السورية والمهارات العملية. تعلّم أو علّم واكسب من الإنترنت.",
              "sameAs": [],
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "دورات مجانية ومدفوعة في الحرف والمهارات"
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "SY"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "info@maharat-syria.com",
                "contactType": "customer support",
                "availableLanguage": "Arabic"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Modern Navigation */}
        <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl sm:text-2xl text-blue-600 hover:text-blue-700 transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl">
                    📚
                  </div>
                  <span className="hidden sm:inline">مهاراتنا</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:flex sm:items-center sm:gap-8">
                <Link 
                  href="/" 
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors text-base"
                >
                  الرئيسية
                </Link>
                <Link 
                  href="/courses" 
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors text-base"
                >
                  الدورات
                </Link>
                <Link 
                  href="/teach" 
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors text-base"
                >
                  علّم واكسب
                </Link>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-2 sm:gap-4">
                {user ? (
                  <>
                    <NotificationBell />
                    {/* Avatar + Dropdown — uses padding bridge so mouse doesn't leave group */}
                    <div className="relative group">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full text-white flex items-center justify-center font-bold text-sm sm:text-base cursor-pointer select-none ring-2 ring-blue-300 dark:ring-blue-700">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {/* Invisible bridge prevents gap between avatar and menu */}
                      <div className="absolute top-full right-0 pt-2 hidden group-hover:block z-50 min-w-[180px]">
                        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden">
                          {/* User info */}
                          <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">مرحباً</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                          </div>
                          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors">
                            <span>👤</span> الملف الشخصي
                          </Link>
                          <Link href={user.role === 'admin' ? '/dashboard/admin' : user.role === 'craftsman' ? '/dashboard/instructor' : '/dashboard/learner'} className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors border-t border-gray-100 dark:border-neutral-700">
                            <span>📊</span> لوحة التحكم
                          </Link>
                          <form action="/api/logout" method="POST" className="border-t border-gray-200 dark:border-neutral-700">
                            <button type="submit" className="flex items-center gap-3 w-full text-right px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-colors">
                              <span>🚪</span> خروج
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="btn btn-primary btn-sm"
                    >
                      دخول
                    </Link>
                    <Link 
                      href="/register" 
                      className="hidden sm:inline-flex btn btn-secondary btn-sm"
                    >
                      حساب جديد
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="sm:hidden border-t border-gray-200 dark:border-neutral-800">
              <div className="flex justify-around py-2">
                <Link 
                  href="/" 
                  className="flex flex-col items-center gap-1 py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition-colors"
                >
                  <span className="text-xl">🏠</span>
                  الرئيسية
                </Link>
                <Link 
                  href="/courses" 
                  className="flex flex-col items-center gap-1 py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition-colors"
                >
                  <span className="text-xl">📚</span>
                  الدورات
                </Link>
                {user ? (
                  <MobileUserMenu user={{ name: user.name, role: user.role }} />
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="flex flex-col items-center gap-1 py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition-colors"
                    >
                      <span className="text-xl">🔑</span>
                      دخول
                    </Link>
                    <Link 
                      href="/register" 
                      className="flex flex-col items-center gap-1 py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition-colors"
                    >
                      <span className="text-xl">➕</span>
                      اشتراك
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        {user && <OnlineTracker />}
        <PWAInstallPrompt />
        {children}
        
        {/* Modern Footer */}
        <footer className="bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border-t-2 border-blue-100 dark:border-neutral-800 mt-auto">
          <div className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                    📚
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">مهاراتنا</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  منصة رائدة لتوثيق وتعليم الحرف التقليدية السورية ونقل التراث للأجيال القادمة.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">روابط سريعة</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>←</span> الرئيسية
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>←</span> الدورات
                    </Link>
                  </li>
                  <li>
                    <Link href="/teach" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>←</span> علّم واكسب
                    </Link>
                  </li>
                  <li>
                    <Link href="/learn" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>←</span> ابدأ التعلم
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">الدعم</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a 
                      href="mailto:info@maharat-syria.com" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <span>✉️</span> البريد الإلكتروني
                    </a>
                  </li>
                  <li>
                    <a 
                      href="tel:+963" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <span>📱</span> هاتفنا
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">قانوني</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      href="/privacy" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      سياسة الخصوصية
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terms" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      شروط الخدمة
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-neutral-800 my-8"></div>

            {/* Bottom */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center sm:text-right">
                &copy; {new Date().getFullYear()} منصة مهاراتنا. جميع الحقوق محفوظة.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 dark:text-gray-500">تابعنا:</span>
                <div className="flex gap-3">
                  <a href="#" className="w-8 h-8 bg-gray-200 dark:bg-neutral-800 hover:bg-blue-500 dark:hover:bg-blue-600 rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all text-sm">
                    f
                  </a>
                  <a href="#" className="w-8 h-8 bg-gray-200 dark:bg-neutral-800 hover:bg-blue-500 dark:hover:bg-blue-600 rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all text-sm">
                    🐦
                  </a>
                  <a href="#" className="w-8 h-8 bg-gray-200 dark:bg-neutral-800 hover:bg-blue-500 dark:hover:bg-blue-600 rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all text-sm">
                    📷
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
