'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteContentButton({ courseId, contentId }: { courseId: string; contentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/content?contentId=${contentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('حدث خطأ أثناء الحذف');
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
      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors disabled:opacity-50 text-sm"
      title="حذف الدرس"
    >
      {loading ? '...' : '🗑️'}
    </button>
  );
}
