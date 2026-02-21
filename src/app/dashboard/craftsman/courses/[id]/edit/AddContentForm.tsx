'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddContentForm({ courseId, nextOrder }: { courseId: string, nextOrder: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'video',
    content: '', // URL or text content
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, order: nextOrder })
      });

      if (!res.ok) throw new Error('Failed to add content');

      setFormData({ title: '', type: 'video', content: '' });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة المحتوى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">عنوان الدرس</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">النوع</label>
        <select
          className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.type}
          onChange={e => setFormData({...formData, type: e.target.value})}
        >
          <option value="video">🎬 فيديو (رابط YouTube أو Google Drive)</option>
          <option value="text">📝 نص</option>
          <option value="image">🖼️ صورة (رابط Google Drive أو رابط مباشر)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {formData.type === 'text' ? 'المحتوى النصي' : 'الرابط (URL)'}
        </label>
        {formData.type === 'text' ? (
          <textarea
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
          />
        ) : (
          <>
            <input
              type="url"
              required
              placeholder={formData.type === 'video' 
                ? "https://drive.google.com/file/d/.../view أو YouTube" 
                : "https://drive.google.com/file/d/.../view"}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.type === 'video' 
                ? '💡 ارفع الفيديو على Google Drive → انقر بالزر الأيمن → مشاركة → تغيير إلى "أي شخص لديه الرابط" → انسخ الرابط والصقه هنا'
                : '💡 ارفع الصورة على Google Drive → انقر بالزر الأيمن → مشاركة → تغيير إلى "أي شخص لديه الرابط" → انسخ الرابط والصقه هنا'}
            </p>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? 'جاري الإضافة...' : 'إضافة الدرس'}
      </button>
    </form>
  );
}
