'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري التحقق من الدفع...');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('معرّف الجلسة غير موجود');
      return;
    }

    const verifyAndEnroll = async () => {
      try {
        // Check payment status
        const statusRes = await fetch(`/api/checkout/session-status?session_id=${sessionId}`);
        const statusData = await statusRes.json();

        if (statusData.status !== 'paid') {
          setStatus('error');
          setMessage('لم يتم الدفع بنجاح. يرجى المحاولة مرة أخرى.');
          return;
        }

        // Enroll the user
        const enrollRes = await fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: statusData.courseId,
            stripeSessionId: sessionId,
          }),
        });

        if (enrollRes.ok) {
          setStatus('success');
          setMessage('تم الدفع والتسجيل بنجاح! جاري التوجيه...');
          setTimeout(() => {
            router.push(`/courses/${statusData.courseId}/learn`);
          }, 2000);
        } else {
          const errorData = await enrollRes.json();
          if (errorData.message === 'Already enrolled') {
            setStatus('success');
            setMessage('أنت مسجل بالفعل! جاري التوجيه...');
            setTimeout(() => {
              router.push(`/courses/${statusData.courseId}/learn`);
            }, 2000);
          } else {
            setStatus('error');
            setMessage('حدث خطأ أثناء التسجيل. تم الدفع بنجاح، يرجى التواصل مع الدعم.');
          }
        }
      } catch (error) {
        console.error(error);
        setStatus('error');
        setMessage('حدث خطأ غير متوقع. يرجى التواصل مع الدعم.');
      }
    };

    verifyAndEnroll();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8 text-center border border-gray-200 dark:border-neutral-800">
          {status === 'loading' && (
            <>
              <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold mb-4">جاري التحقق...</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">تم بنجاح!</h1>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ</h1>
            </>
          )}

          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

          {status === 'error' && (
            <button
              onClick={() => router.push('/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
              العودة للدورات
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
