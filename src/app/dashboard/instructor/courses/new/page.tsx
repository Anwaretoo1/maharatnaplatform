'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/app/components/FileUpload';

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    isFree: false,
    thumbnailUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to create course');

      const course = await res.json();
      router.push(`/dashboard/craftsman/courses/${course.id}/edit`);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إنشاء الدورة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">إنشاء دورة جديدة</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-800">
        <div>
          <label className="block text-sm font-medium mb-1">عنوان الدورة</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الوصف</label>
          <textarea
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">التصنيف</label>
          <select
            required
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            <option value="">اختر تصنيفاً</option>
            <option value="woodwork">نجارة وحفر على الخشب</option>
            <option value="mosaic">فسيفساء</option>
            <option value="textile">نسيج وتطريز</option>
            <option value="pottery">فخار وخزف</option>
            <option value="metalwork">أعمال معدنية ونحاسيات</option>
            <option value="glass">زجاج يدوي</option>
            <option value="leather">جلديات</option>
            <option value="soap">صناعة الصابون</option>
            <option value="food">طبخ وحلويات تقليدية</option>
            <option value="calligraphy">خط عربي وزخرفة</option>
            <option value="jewelry">مجوهرات يدوية</option>
            <option value="programming">برمجة</option>
            <option value="design">تصميم</option>
            <option value="business">أعمال</option>
            <option value="other">أخرى</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={formData.isFree}
              onChange={e => setFormData({...formData, isFree: e.target.checked})}
            />
            <span className="mr-2">دورة مجانية</span>
          </label>
        </div>

        {!formData.isFree && (
          <div>
            <label className="block text-sm font-medium mb-1">السعر ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
              value={formData.price}
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">الصورة المصغرة (اختياري)</label>
          <FileUpload
            accept="image/*"
            label=""
            maxSizeMB={10}
            onUploadComplete={(url) => setFormData({...formData, thumbnailUrl: url})}
            currentUrl={formData.thumbnailUrl || undefined}
          />
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">أو أدخل رابطاً مباشراً:</p>
            <input
              type="url"
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 text-sm"
              placeholder="https://drive.google.com/file/d/.../view أو رابط صورة مباشر"
              value={formData.thumbnailUrl}
              onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء ومتابعة لإضافة المحتوى'}
        </button>
      </form>
    </div>
  );
}
