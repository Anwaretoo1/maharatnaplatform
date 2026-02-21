'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id || e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          throw new Error(data.error || 'فشل إنشاء الحساب');
        } else {
          const text = await response.text();
          console.error('Server Error:', text);
          throw new Error('حدث خطأ في الخادم. الرجاء المحاولة لاحقاً.');
        }
      }

      // Redirect to login page on success
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-md p-8 border border-gray-200 dark:border-neutral-800">
        <h1 className="text-2xl font-bold text-center mb-6">إنشاء حساب جديد</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
              placeholder="الاسم الكامل"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نوع الحساب
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="role" 
                  value="learner" 
                  checked={formData.role === 'learner'}
                  onChange={handleChange}
                  className="mr-2 text-blue-600" 
                />
                <span className="mr-2">متعلم</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="role" 
                  value="craftsman" 
                  checked={formData.role === 'craftsman'}
                  onChange={handleChange}
                  className="mr-2 text-blue-600" 
                />
                <span className="mr-2">حرفي</span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </main>
  );
}
