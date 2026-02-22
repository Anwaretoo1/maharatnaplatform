'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    } catch (_error) {
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
    <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔑</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          تعيين كلمة مرور جديدة
        </h2>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-5 rounded-xl text-center">
          <span className="text-2xl block mb-2">✅</span>
          <p className="font-medium">{message}</p>
          <p className="text-sm mt-2 opacity-75">سيتم تحويلك لصفحة الدخول...</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور الجديدة
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              تأكيد كلمة المرور
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              <span>⚠️</span>
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn btn-primary btn-full"
          >
            {status === 'loading' ? '⏳ جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
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
