'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setStatus('error');
      setMessage('رابط غير صالح');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'حدث خطأ ما');
      }
    } catch (error) {
      setStatus('error');
      setMessage('حدث خطأ في الاتصال');
    }
  };

  if (!token) {
    return (
      <div className="text-center text-red-500">
        رابط غير صالح. يرجى التأكد من الرابط المرسل في البريد الإلكتروني.
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-neutral-800">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          تعيين كلمة مرور جديدة
        </h2>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-md text-center">
          {message}
          <p className="text-sm mt-2">سيتم تحويلك لصفحة الدخول...</p>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                كلمة المرور الجديدة
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-neutral-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                تأكيد كلمة المرور
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-neutral-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="text-red-500 text-sm text-center">{message}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === 'loading' ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
