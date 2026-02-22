'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/app/components/FileUpload';

export default function AddContentForm({ courseId, nextOrder }: { courseId: string, nextOrder: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
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
      setInputMode('upload');
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
          onChange={e => setFormData({...formData, type: e.target.value, content: ''})}
        >
          <option value="video">🎬 فيديو</option>
          <option value="text">📝 نص</option>
          <option value="image">🖼️ صورة</option>
        </select>
      </div>

      <div>
        {formData.type === 'text' ? (
          <div>
            <label className="block text-sm font-medium mb-1">المحتوى النصي</label>
            <textarea
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Toggle between upload/url mode */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                📤 رفع ملف
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                🔗 رابط خارجي
              </button>
            </div>

            {inputMode === 'upload' ? (
              <FileUpload
                accept={formData.type === 'video' ? 'video/*' : 'image/*'}
                label={formData.type === 'video' ? 'رفع فيديو' : 'رفع صورة'}
                maxSizeMB={formData.type === 'video' ? 100 : 10}
                onUploadComplete={(url) => setFormData({...formData, content: url})}
                currentUrl={formData.content || undefined}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">الرابط (URL)</label>
                <input
                  type="url"
                  required={inputMode === 'url'}
                  placeholder={formData.type === 'video' 
                    ? "https://drive.google.com/file/d/.../view أو YouTube" 
                    : "https://drive.google.com/file/d/.../view"}
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 يمكنك استخدام رابط Google Drive أو YouTube أو أي رابط مباشر
                </p>
              </div>
            )}

            {formData.content && (
              <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md truncate">
                ✅ الرابط: {formData.content}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || (!formData.content && formData.type !== 'text')}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? 'جاري الإضافة...' : 'إضافة الدرس'}
      </button>
    </form>
  );
}
