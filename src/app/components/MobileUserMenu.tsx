'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileUserMenuProps {
  user: {
    name: string;
    role: string;
  } | null;
}

export default function MobileUserMenu({ user }: MobileUserMenuProps) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const dashboardHref =
    user.role === 'admin'
      ? '/dashboard/admin'
      : user.role === 'craftsman'
      ? '/dashboard/instructor'
      : '/dashboard/learner';

  return (
    <>
      {/* User avatar button in bottom nav */}
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 py-2 px-3 text-gray-600 dark:text-gray-400 text-[11px] font-medium"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full text-white flex items-center justify-center font-bold text-xs">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
        حسابي
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full" />
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full text-white flex items-center justify-center font-bold text-lg">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role === 'admin' ? 'مدير' : user.role === 'craftsman' ? 'حرفي' : 'متعلم'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-2">
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 px-5 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 text-base font-semibold"
          >
            <span className="text-2xl">👤</span>
            الملف الشخصي
          </Link>
          <Link
            href={dashboardHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 px-5 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 text-base font-semibold border-t border-gray-100 dark:border-neutral-800"
          >
            <span className="text-2xl">📊</span>
            لوحة التحكم
          </Link>
          <Link
            href="/courses"
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 px-5 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 text-base font-semibold border-t border-gray-100 dark:border-neutral-800"
          >
            <span className="text-2xl">📚</span>
            الدورات
          </Link>

          {/* Logout */}
          <form action="/api/logout" method="POST" className="border-t border-gray-100 dark:border-neutral-800">
            <button
              type="submit"
              className="flex items-center gap-4 w-full text-right px-5 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-base font-bold"
            >
              <span className="text-2xl">🚪</span>
              تسجيل الخروج
            </button>
          </form>
        </div>

        {/* Safe area bottom */}
        <div className="h-6" />
      </div>
    </>
  );
}
