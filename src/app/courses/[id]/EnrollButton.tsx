'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  courseId: string;
  isLoggedIn: boolean;
  isFree: boolean;
  price?: number | null;
}

export default function EnrollButton({ courseId, isLoggedIn, isFree, price }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    setLoading(true);
    try {
      if (isFree) {
        // Free course: enroll directly
        const res = await fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });

        if (res.ok) {
          router.push(`/courses/${courseId}/learn`);
          router.refresh();
        } else {
          const data = await res.json();
          alert(data.error || 'حدث خطأ أثناء التسجيل');
        }
      } else {
        // Paid course: redirect to Stripe Checkout
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });

        const data = await res.json();

        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || 'حدث خطأ أثناء إنشاء جلسة الدفع');
        }
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
      className={`w-full font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 text-white ${
        isFree
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {loading
        ? (isFree ? 'جاري التسجيل...' : 'جاري التوجيه للدفع...')
        : (isFree ? 'سجل مجاناً' : `اشترِ الآن - $${price || 0}`)
      }
    </button>
  );
}
