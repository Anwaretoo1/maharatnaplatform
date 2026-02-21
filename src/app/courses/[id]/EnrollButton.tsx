'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EnrollButton({ courseId, isLoggedIn }: { courseId: string, isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (res.ok) {
        router.push(`/courses/${courseId}/learn`);
        router.refresh();
      } else {
        alert('حدث خطأ أثناء التسجيل');
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
      onClick={handleEnroll}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
    >
      {loading ? 'جاري التسجيل...' : 'سجل الآن'}
    </button>
  );
}
