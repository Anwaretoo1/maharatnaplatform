'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  isLoggedIn: boolean;
  isFree: boolean;
  price?: number | null;
}

export default function EnrollButton({ courseId, courseTitle, isLoggedIn, isFree, price }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    if (isFree) {
      // Free course: enroll directly
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
          const data = await res.json();
          alert(data.error || 'حدث خطأ أثناء التسجيل');
        }
      } catch (error) {
        console.error(error);
        alert('حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    } else {
      // Paid course: show payment options
      setShowCodeInput(true);
    }
  };

  const handleContactAdmin = async () => {
    setLoading(true);
    try {
      // Find admin user
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      const admin = (usersData.users || []).find((u: { role: string }) => u.role === 'admin');

      if (!admin) {
        alert('لا يوجد مسؤول حالياً');
        return;
      }

      // Send message to admin requesting enrollment
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: admin.id,
          subject: `طلب شراء دورة: ${courseTitle}`,
          content: `أرغب في شراء دورة "${courseTitle}" بسعر $${price || 0}.\n\nأرجو إرشادي لطريقة الدفع وإرسال رمز التسجيل بعد استلام الدفعة.\n\nشكراً لكم.`,
        }),
      });

      if (res.ok) {
        setMessageSent(true);
      } else {
        const data = await res.json();
        alert(data.error || 'فشل إرسال الرسالة');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/enrollment-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeem', code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'تم التسجيل بنجاح!');
        router.push(`/courses/${courseId}/learn`);
        router.refresh();
      } else {
        alert(data.error || 'الرمز غير صالح');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // Free course button
  if (isFree) {
    return (
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 text-white bg-green-600 hover:bg-green-700"
      >
        {loading ? 'جاري التسجيل...' : 'سجل مجاناً'}
      </button>
    );
  }

  // Paid course: show payment flow
  if (!showCodeInput) {
    return (
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 text-white bg-blue-600 hover:bg-blue-700"
      >
        {`اشترِ الآن - $${price || 0}`}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Code input */}
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-sm">🔑 هل لديك رمز تسجيل؟</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="أدخل الرمز (مثال: MH-A1B2C3D4)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-neutral-700 dark:border-neutral-600 font-mono text-center tracking-wider"
            dir="ltr"
          />
          <button
            onClick={handleRedeemCode}
            disabled={loading || !code.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 text-sm"
          >
            {loading ? '...' : 'تفعيل'}
          </button>
        </div>
      </div>

      {/* Contact admin for payment */}
      <div className="border-t border-gray-200 dark:border-neutral-700 pt-3">
        {messageSent ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <p className="text-green-700 dark:text-green-400 font-medium text-sm">✅ تم إرسال طلب الشراء للمسؤول</p>
            <p className="text-green-600 dark:text-green-500 text-xs mt-1">ستصلك رسالة بتعليمات الدفع ورمز التسجيل</p>
            <button
              onClick={() => router.push('/dashboard/messages')}
              className="mt-2 text-blue-600 hover:underline text-xs font-medium"
            >
              📩 الذهاب للرسائل
            </button>
          </div>
        ) : (
          <button
            onClick={handleContactAdmin}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-md disabled:opacity-50 text-sm"
          >
            {loading ? 'جاري الإرسال...' : '💬 تواصل مع المسؤول للدفع'}
          </button>
        )}
      </div>

      <button
        onClick={() => setShowCodeInput(false)}
        className="w-full text-gray-500 hover:text-gray-700 text-xs py-1"
      >
        ← رجوع
      </button>
    </div>
  );
}
