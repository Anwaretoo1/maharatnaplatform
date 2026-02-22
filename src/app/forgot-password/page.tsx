'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'حدث خطأ ما');
      }
    } catch (_error) {
      setStatus('error');
      setMessage('حدث خطأ في الاتصال');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            نسيت كلمة المرور؟
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-5 rounded-xl text-center">
            <span className="text-2xl block mb-2">✅</span>
            <p className="font-medium">{message}</p>
            <div className="mt-4">
              <Link href="/login" className="btn btn-primary btn-sm inline-flex">
                العودة لتسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {status === 'loading' ? '⏳ جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
                ← العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
