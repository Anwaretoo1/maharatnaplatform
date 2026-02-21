'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      // Store user info in localStorage (simple auth for now)
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on user role
      const role = data.user.role;
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else if (role === 'craftsman') {
        router.push('/dashboard/craftsman');
      } else {
        router.push('/dashboard/learner');
      }
      router.refresh(); // Refresh to update UI based on auth state
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-md p-8 border border-gray-200 dark:border-neutral-800">
        <h1 className="text-2xl font-bold text-center mb-6">تسجيل الدخول</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
              placeholder="name@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
              <span className="mr-2 text-gray-600 dark:text-gray-400">تذكرني</span>
            </label>
            <Link href="/forgot-password" className="text-blue-600 hover:underline">نسيت كلمة المرور؟</Link>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </main>
  );
}
