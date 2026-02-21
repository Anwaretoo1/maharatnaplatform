'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟\nسيتم حذف جميع دوراته وبياناته نهائياً.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل حذف المستخدم');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium disabled:opacity-50"
      title="حذف المستخدم">
      {loading ? '...' : '🗑️'}
    </button>
  );
}

export function ChangeRoleButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const roles = [
    { value: 'learner', label: 'متعلم', color: 'text-blue-600' },
    { value: 'craftsman', label: 'حرفي', color: 'text-green-600' },
    { value: 'admin', label: 'مسؤول', color: 'text-red-600' },
  ];

  const handleChange = async (newRole: string) => {
    if (newRole === currentRole) { setShowMenu(false); return; }
    setLoading(true);
    setShowMenu(false);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'changeRole', newRole }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل تغيير الدور');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setShowMenu(!showMenu)} disabled={loading}
        className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xs font-medium disabled:opacity-50"
        title="تغيير الدور">
        {loading ? '...' : '🔄'}
      </button>
      {showMenu && (
        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-50 min-w-[100px]">
          {roles.map((role) => (
            <button key={role.value} onClick={() => handleChange(role.value)}
              className={`block w-full text-right px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-neutral-700 ${role.color} ${currentRole === role.value ? 'font-bold bg-gray-50 dark:bg-neutral-750' : ''}`}>
              {role.label} {currentRole === role.value ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResetPasswordButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const newPassword = prompt(`إعادة تعيين كلمة المرور للمستخدم "${userName}"\n\nاكتب كلمة المرور الجديدة (أو اتركه فارغاً لتعيينها إلى password123):`);
    if (newPassword === null) return; // cancelled
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'resetPassword', newPassword: newPassword || 'password123' }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert(data.error || 'فشل إعادة تعيين كلمة المرور');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  return (
    <button onClick={handleReset} disabled={loading}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium disabled:opacity-50"
      title="إعادة تعيين كلمة المرور">
      {loading ? '...' : '🔑'}
    </button>
  );
}

export function DeleteCourseAdminButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف الدورة "${courseTitle}"؟\nسيتم حذف جميع المحتوى والتسجيلات المرتبطة بها.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل حذف الدورة');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium disabled:opacity-50"
      title="حذف الدورة">
      {loading ? '...' : '🗑️'}
    </button>
  );
}

export function SendMessageButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');

  const handleSend = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId, subject, content }),
      });
      if (res.ok) {
        alert('تم إرسال الرسالة بنجاح');
        setShowModal(false);
        setContent('');
        setSubject('');
      } else {
        const data = await res.json();
        alert(data.error || 'فشل الإرسال');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-xs font-medium"
        title={`إرسال رسالة إلى ${userName}`}>
        💬
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="font-bold">رسالة إلى {userName}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="الموضوع (اختياري)"
                className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                rows={4}
                placeholder="اكتب رسالتك..."
                className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button
                onClick={handleSend}
                disabled={loading || !content.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 text-sm"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
