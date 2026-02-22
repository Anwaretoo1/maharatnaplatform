'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteCourseButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/courses?id=${courseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/craftsman');
        router.refresh();
      } else {
        alert('حدث خطأ أثناء حذف الدورة');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 text-sm"
    >
      {loading ? 'جاري الحذف...' : 'حذف الدورة'}
    </button>
  );
}
