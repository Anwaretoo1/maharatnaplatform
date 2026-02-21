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
