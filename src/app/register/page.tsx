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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-gray-100 dark:bg-neutral-950">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-neutral-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إنشاء حساب جديد</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">انضم إلى مجتمع مهاراتنا</p>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-5">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="الاسم الكامل"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="name@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
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
            className="btn btn-primary btn-full"
          >
            {loading ? '⏳ جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </main>
  );
}
