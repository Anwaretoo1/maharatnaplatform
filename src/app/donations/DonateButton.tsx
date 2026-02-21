'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DonateButtonProps {
  type: 'platform' | 'craftsman' | 'partnership';
  craftsmanName?: string;
}

export default function DonateButton({ type, craftsmanName }: DonateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleDonate = async () => {
    setLoading(true);
    try {
      // Find admin
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      const admin = (usersData.users || []).find((u: { role: string }) => u.role === 'admin');

      if (!admin) {
        alert('لا يوجد مسؤول حالياً');
        setLoading(false);
        return;
      }

      let subject = '';
      let content = '';

      if (type === 'platform') {
        subject = 'طلب تبرع لدعم المنصة';
        content = 'أرغب في التبرع لدعم منصة مهاراتنا.\n\nأرجو إرشادي لطريقة التبرع.\n\nشكراً لكم.';
      } else if (type === 'craftsman') {
        subject = `طلب تبرع لدعم الحرفي: ${craftsmanName}`;
        content = `أرغب في التبرع لدعم الحرفي "${craftsmanName}".\n\nأرجو إرشادي لطريقة التبرع وإيصاله للحرفي.\n\nشكراً لكم.`;
      } else {
        subject = 'طلب شراكة مع المنصة';
        content = 'أرغب في الاستفسار عن فرص الشراكة مع منصة مهاراتنا.\n\nشكراً لكم.';
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: admin.id, subject, content }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        alert(data.error || 'فشل إرسال الرسالة');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center">
        <span className="text-green-600 text-sm font-medium">✅ تم الإرسال</span>
        <button
          onClick={() => router.push('/dashboard/messages')}
          className="block text-blue-600 text-xs hover:underline mt-1"
        >
          📩 الرسائل
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDonate}
      disabled={loading}
      className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
        type === 'craftsman'
          ? 'bg-green-600 hover:bg-green-700 text-white text-xs'
          : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
      }`}
    >
      {loading ? '...' : type === 'craftsman' ? '💚 تبرع' : '💬 تواصل مع الإدارة'}
    </button>
  );
}
