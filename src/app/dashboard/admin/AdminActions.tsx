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
    { value: 'craftsman', label: 'معلم', color: 'text-green-600' },
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

export function GenerateCodeButton({ courses }: { courses: { id: string; title: string; isFree: boolean; price: number | null }[] }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [codeCount, setCodeCount] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);

  // Fetch existing codes
  const [existingCodes, setExistingCodes] = useState<{
    id: string; code: string; isUsed: boolean; createdAt: string;
    course: { id: string; title: string };
    usedBy: { name: string; email: string } | null;
  }[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const fetchCodes = async () => {
    setLoadingCodes(true);
    const res = await fetch('/api/enrollment-codes');
    if (res.ok) {
      const data = await res.json();
      setExistingCodes(data.codes || []);
    }
    setLoadingCodes(false);
  };

  const handleGenerate = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const res = await fetch('/api/enrollment-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', courseId: selectedCourse, count: codeCount }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedCodes(data.codes);
        setShowCodes(true);
        fetchCodes(); // Refresh list
      } else {
        alert(data.error || 'فشل إنشاء الرموز');
      }
    } catch {
      alert('حدث خطأ');
    }
    setLoading(false);
  };

  const paidCourses = courses.filter(c => !c.isFree);

  return (
    <>
      <button
        onClick={() => { setShowModal(true); fetchCodes(); }}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
      >
        🔑 إدارة رموز التسجيل
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setShowCodes(false); setGeneratedCodes([]); }}>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="font-bold text-lg">🔑 إدارة رموز التسجيل</h2>
              <button onClick={() => { setShowModal(false); setShowCodes(false); setGeneratedCodes([]); }} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>

            <div className="p-4 space-y-6">
              {/* Generate new codes */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-sm text-purple-800 dark:text-purple-300">إنشاء رموز جديدة</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">الدورة المدفوعة</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-800 dark:border-neutral-700"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      <option value="">اختر الدورة</option>
                      {paidCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} (${c.price})</option>
                      ))}
                      {courses.filter(c => c.isFree).map(c => (
                        <option key={c.id} value={c.id}>{c.title} (مجاني)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">عدد الرموز</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-800 dark:border-neutral-700"
                      value={codeCount}
                      onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !selectedCourse}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 text-sm"
                >
                  {loading ? 'جاري الإنشاء...' : `إنشاء ${codeCount} رمز`}
                </button>

                {/* Show generated codes */}
                {showCodes && generatedCodes.length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-400 font-medium text-sm mb-2">✅ تم إنشاء الرموز:</p>
                    <div className="space-y-1">
                      {generatedCodes.map((code, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700 rounded px-3 py-1.5">
                          <code className="font-mono text-sm font-bold tracking-wider">{code}</code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(code); }}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            نسخ
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCodes.join('\n'));
                        alert('تم نسخ جميع الرموز');
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      📋 نسخ الكل
                    </button>
                  </div>
                )}
              </div>

              {/* Existing codes list */}
              <div>
                <h3 className="font-bold text-sm mb-3">الرموز المُنشأة ({existingCodes.length})</h3>
                {loadingCodes ? (
                  <p className="text-gray-500 text-sm text-center py-4">جاري التحميل...</p>
                ) : existingCodes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-neutral-700">
                          <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">الرمز</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">الدورة</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">الحالة</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">المستخدم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {existingCodes.map(ec => (
                          <tr key={ec.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                            <td className="py-2 px-2 font-mono text-xs font-bold tracking-wider">{ec.code}</td>
                            <td className="py-2 px-2 text-xs">{ec.course.title}</td>
                            <td className="py-2 px-2">
                              {ec.isUsed ? (
                                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">مستخدم</span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">متاح</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-xs text-gray-500">
                              {ec.usedBy ? `${ec.usedBy.name} (${ec.usedBy.email})` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">لا توجد رموز مُنشأة بعد</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ========== Discount Manager ==========
export function DiscountManager({ courses, role }: { courses: { id: string; title: string; isFree: boolean; price: number | null }[]; role: 'admin' | 'craftsman' }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState<{
    id: string; percentage: number; description: string | null; isActive: boolean;
    startDate: string; endDate: string;
    course: { id: string; title: string; price: number | null } | null;
    createdBy: { id: string; name: string; role: string };
  }[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [percentage, setPercentage] = useState(10);
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');

  const paidCourses = courses.filter(c => !c.isFree);

  const fetchDiscounts = async () => {
    setLoadingList(true);
    const res = await fetch('/api/discounts?active=false');
    if (res.ok) {
      const data = await res.json();
      setDiscounts(data.discounts || []);
    }
    setLoadingList(false);
  };

  const handleCreate = async () => {
    if (!isGlobal && !selectedCourse) {
      alert('اختر دورة أو فعّل الخصم العام');
      return;
    }
    if (!endDate) {
      alert('حدد تاريخ انتهاء الخصم');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: isGlobal ? null : selectedCourse,
          percentage,
          description: description || null,
          endDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'تم إنشاء الخصم بنجاح');
        setSelectedCourse('');
        setDescription('');
        setEndDate('');
        fetchDiscounts();
      } else {
        alert(data.error || 'فشل إنشاء الخصم');
      }
    } catch {
      alert('حدث خطأ');
    }
    setLoading(false);
  };

  const handleDeactivate = async (discountId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الخصم؟')) return;
    try {
      const res = await fetch('/api/discounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountId }),
      });
      if (res.ok) {
        fetchDiscounts();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل');
      }
    } catch {
      alert('حدث خطأ');
    }
  };

  return (
    <>
      <button
        onClick={() => { setShowModal(true); fetchDiscounts(); }}
        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
      >
        🏷️ إدارة الخصومات
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="font-bold text-lg">🏷️ إدارة الخصومات</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>

            <div className="p-4 space-y-6">
              {/* Create new discount */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">إنشاء خصم جديد</h3>
                
                {role === 'admin' && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isGlobal}
                      onChange={(e) => { setIsGlobal(e.target.checked); if (e.target.checked) setSelectedCourse(''); }}
                      className="rounded"
                    />
                    <span>خصم عام (على جميع الدورات المدفوعة)</span>
                  </label>
                )}

                {!isGlobal && (
                  <div>
                    <label className="block text-xs font-medium mb-1">الدورة</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-800 dark:border-neutral-700"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      <option value="">اختر الدورة المدفوعة</option>
                      {paidCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} (${c.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">نسبة الخصم %</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-800 dark:border-neutral-700"
                      value={percentage}
                      onChange={(e) => setPercentage(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">ينتهي في</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-800 dark:border-neutral-700"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">وصف (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: خصم رمضان"
                    className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-800 dark:border-neutral-700"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 text-sm"
                >
                  {loading ? 'جاري الإنشاء...' : `إنشاء خصم ${percentage}%`}
                </button>
              </div>

              {/* Existing discounts list */}
              <div>
                <h3 className="font-bold text-sm mb-3">الخصومات ({discounts.length})</h3>
                {loadingList ? (
                  <p className="text-gray-500 text-sm text-center py-4">جاري التحميل...</p>
                ) : discounts.length > 0 ? (
                  <div className="space-y-2">
                    {discounts.map(d => {
                      const isExpired = new Date(d.endDate) < new Date();
                      const isRunning = d.isActive && !isExpired;
                      return (
                        <div key={d.id} className={`p-3 rounded-lg border ${isRunning ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-sm">{d.percentage}% خصم</span>
                              <span className="text-xs text-gray-500 mr-2">
                                {d.course ? d.course.title : '🌍 عام'}
                              </span>
                              {d.description && <span className="text-xs text-gray-400 block">{d.description}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {isRunning ? (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">نشط</span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">منتهي</span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">ملغي</span>
                              )}
                              {isRunning && (
                                <button
                                  onClick={() => handleDeactivate(d.id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  إلغاء
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            حتى {new Date(d.endDate).toLocaleDateString('ar-SA')} · بواسطة {d.createdBy.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">لا توجد خصومات</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
