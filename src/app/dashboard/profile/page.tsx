'use client';

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    name: string;
    bio: string;
    profileImage: string;
    role: string;
  }>({ name: '', bio: '', profileImage: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.user?.name || '',
          bio: data.user?.bio || '',
          profileImage: data.user?.profileImage || '',
          role: data.user?.role || '',
        });
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, profileImage: data.url }));
      } else {
        alert('فشل رفع الصورة');
      }
    } catch {
      alert('خطأ في رفع الصورة');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          profileImage: profile.profileImage,
        }),
      });
      if (res.ok) {
        setMessage('تم حفظ التغييرات بنجاح ✅');
      } else {
        const data = await res.json();
        setMessage(data.error || 'فشل حفظ التغييرات');
      }
    } catch {
      setMessage('حدث خطأ في الاتصال');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">الملف الشخصي</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 sm:p-6 max-w-2xl">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 dark:border-neutral-700 mb-3">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="صورة شخصية" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl font-bold text-blue-600">
                {profile.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <span className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-md transition-colors inline-block">
              {uploading ? 'جاري الرفع...' : '📷 تغيير الصورة'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={uploading}
            />
          </label>
          {profile.profileImage && (
            <button
              onClick={() => setProfile(prev => ({ ...prev, profileImage: '' }))}
              className="text-red-500 text-xs mt-2 hover:underline"
            >
              إزالة الصورة
            </button>
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">الاسم</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">نبذة تعريفية</label>
          <textarea
            rows={5}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            placeholder={profile.role === 'craftsman' ? 'اكتب نبذة عن خبرتك ومجالاتك...' : 'اكتب نبذة عن نفسك...'}
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            {profile.role === 'craftsman' ? 'ستظهر هذه النبذة في ملفك الشخصي العام وصفحة المعلمين' : 'ستظهر هذه النبذة في ملفك الشخصي'}
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md disabled:opacity-50 transition-colors"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
