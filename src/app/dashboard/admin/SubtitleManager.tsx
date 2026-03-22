'use client';

import { useState, useEffect } from 'react';

interface ContentItem {
  id: string;
  title: string;
  originalTitle: string | null;
  order: number;
  type: string;
  hasSubtitles: boolean;
  sourceVideoUrl: string | null;
}

export default function SubtitleManager() {
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [subtitleText, setSubtitleText] = useState('');
  const [format, setFormat] = useState<'srt' | 'vtt'>('srt');
  const [skipTranslation, setSkipTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch imported courses
  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch('/api/admin/import-course');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      // ignore
    }
    setLoadingCourses(false);
  };

  // Fetch course contents when course is selected
  useEffect(() => {
    if (!selectedCourse) {
      setContents([]);
      return;
    }
    fetch(`/api/admin/subtitles?courseId=${selectedCourse}`)
      .then(res => res.json())
      .then(data => setContents(data.contents || []))
      .catch(() => setContents([]));
  }, [selectedCourse]);

  const handleOpen = () => {
    setShowModal(true);
    loadCourses();
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedCourse('');
    setSelectedContent('');
    setSubtitleText('');
    setMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-detect format from extension
    if (file.name.endsWith('.srt')) setFormat('srt');
    else if (file.name.endsWith('.vtt')) setFormat('vtt');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSubtitleText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedContent || !subtitleText.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: selectedContent,
          subtitleText: subtitleText.trim(),
          format,
          skipTranslation,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        // Refresh contents
        const refreshRes = await fetch(`/api/admin/subtitles?courseId=${selectedCourse}`);
        const refreshData = await refreshRes.json();
        setContents(refreshData.contents || []);
        setSubtitleText('');
        setSelectedContent('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    }

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-gradient-to-l from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all text-sm shadow-md hover:shadow-lg flex items-center gap-2"
      >
        <span className="text-lg">🔤</span>
        إدارة الترجمات
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div>
                <h2 className="font-bold text-lg">🔤 إدارة الترجمات النصية</h2>
                <p className="text-xs text-gray-500 mt-1">رفع ملفات SRT/VTT وترجمتها تلقائياً بالذكاء الاصطناعي</p>
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Course selector */}
              <div>
                <label className="block text-sm font-bold mb-2">اختر الدورة المستوردة</label>
                {loadingCourses ? (
                  <div className="text-sm text-gray-500">جاري التحميل...</div>
                ) : (
                  <select
                    className="w-full px-4 py-3 border-2 rounded-lg text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-teal-500 outline-none"
                    value={selectedCourse}
                    onChange={(e) => { setSelectedCourse(e.target.value); setSelectedContent(''); }}
                  >
                    <option value="">— اختر دورة —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Content list with subtitle status */}
              {contents.length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-2">فيديوهات الدورة</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto border-2 rounded-lg p-2 dark:border-neutral-700">
                    {contents.filter(c => c.type === 'video').map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedContent(item.id)}
                        className={`w-full text-right p-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                          selectedContent === item.id
                            ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700'
                            : 'hover:bg-gray-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className="text-xs text-gray-400 w-6">{item.order}.</span>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.hasSubtitles ? (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">مترجم ✓</span>
                        ) : (
                          <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 px-2 py-0.5 rounded-full">بدون ترجمة</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload section */}
              {selectedContent && (
                <div className="space-y-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4">
                  <h4 className="font-bold text-sm">رفع ملف ترجمة</h4>

                  {/* File upload */}
                  <div>
                    <input
                      type="file"
                      accept=".srt,.vtt"
                      onChange={handleFileUpload}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 dark:file:bg-teal-900/30 dark:file:text-teal-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">يدعم ملفات .srt و .vtt — يمكنك تحميلها من YouTube أو أي مصدر آخر</p>
                  </div>

                  {/* Or paste manually */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">أو الصق النص يدوياً:</label>
                    <textarea
                      dir="ltr"
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono dark:bg-neutral-900 dark:border-neutral-700 focus:border-teal-500 outline-none"
                      placeholder="WEBVTT&#10;&#10;00:00:01.000 --> 00:00:04.000&#10;Hello and welcome..."
                      value={subtitleText}
                      onChange={(e) => setSubtitleText(e.target.value)}
                    />
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium">الصيغة:</label>
                      <select
                        className="text-xs px-2 py-1 border rounded dark:bg-neutral-900 dark:border-neutral-700"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as 'srt' | 'vtt')}
                      >
                        <option value="srt">SRT</option>
                        <option value="vtt">VTT</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skipTranslation}
                        onChange={(e) => setSkipTranslation(e.target.checked)}
                        className="rounded"
                      />
                      النص عربي بالفعل (تخطي الترجمة)
                    </label>
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={handleUpload}
                    disabled={loading || !subtitleText.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'جاري الترجمة والحفظ...' : skipTranslation ? 'حفظ الترجمة' : 'ترجمة وحفظ'}
                  </button>
                </div>
              )}

              {/* How to get subtitles guide */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-xs">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">كيف تحصل على ملف الترجمة؟</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                  <li>افتح الفيديو على YouTube</li>
                  <li>اضغط على (...) ثم &quot;فتح النسخة النصية&quot; (Open transcript)</li>
                  <li>أو استخدم أدوات مثل <span className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">downsub.com</span> لتحميل ملف SRT</li>
                  <li>ارفع الملف هنا وسيتم ترجمته تلقائياً للعربية</li>
                </ol>
              </div>

              {/* Message */}
              {message && (
                <div className={`rounded-lg p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
