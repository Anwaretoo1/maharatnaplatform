'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImportResult {
  videoId: string;
  originalTitle: string;
  arabicTitle?: string;
  hasSubtitles?: boolean;
  status: string;
  error?: string;
}

type ImportMode = 'single' | 'multi';

export default function ImportCourseButton() {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<ImportMode>('single');
  const [url, setUrl] = useState('');
  const [multiUrls, setMultiUrls] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState('');
  const [courseInfo, setCourseInfo] = useState<{ id: string; title: string; videosProcessed: number; videosSucceeded: number; videosFailed: number } | null>(null);
  const router = useRouter();

  const handleImport = async () => {
    const hasInput = mode === 'single' ? url.trim() : multiUrls.trim();
    if (!hasInput) return;

    setLoading(true);
    setError('');
    setResults(null);
    setCourseInfo(null);
    setProgress('جاري تحليل الروابط واستخراج الفيديوهات...');

    try {
      const body: any = { category: category.trim() || undefined };

      if (mode === 'single') {
        body.url = url.trim();
      } else {
        const urls = multiUrls.split('\n').map(u => u.trim()).filter(Boolean);
        body.url = urls[0];
        body.videoUrls = urls;
      }

      const res = await fetch('/api/admin/import-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء الاستيراد');
        setLoading(false);
        setProgress('');
        return;
      }

      setCourseInfo(data.course);
      setResults(data.results);
      setProgress('');
      router.refresh();
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setUrl('');
    setMultiUrls('');
    setCategory('');
    setResults(null);
    setError('');
    setProgress('');
    setCourseInfo(null);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all text-sm shadow-md hover:shadow-lg flex items-center gap-2"
      >
        <span className="text-lg">🌍</span>
        استيراد دورة أجنبية مترجمة
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
                <h2 className="font-bold text-lg">🌍 استيراد دورة أجنبية</h2>
                <p className="text-xs text-gray-500 mt-1">يدعم YouTube, Vimeo, Coursera, Udemy وأي رابط فيديو</p>
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Input Form */}
              {!results && (
                <div className="space-y-4">
                  {/* Mode switcher */}
                  <div className="flex gap-2 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
                    <button
                      onClick={() => setMode('single')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        mode === 'single'
                          ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-700 dark:text-indigo-400'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      رابط واحد / قائمة تشغيل
                    </button>
                    <button
                      onClick={() => setMode('multi')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        mode === 'multi'
                          ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-700 dark:text-indigo-400'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      روابط متعددة
                    </button>
                  </div>

                  {/* Single URL input */}
                  {mode === 'single' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">رابط الدورة أو الفيديو</label>
                      <input
                        type="url"
                        dir="ltr"
                        placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                        className="w-full px-4 py-3 border-2 rounded-lg text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors font-mono"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        يدعم: YouTube, Vimeo, Coursera, Udemy, Khan Academy, روابط فيديو مباشرة
                      </p>
                    </div>
                  )}

                  {/* Multi URL input */}
                  {mode === 'multi' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">روابط الفيديوهات (رابط في كل سطر)</label>
                      <textarea
                        dir="ltr"
                        rows={6}
                        placeholder={"https://www.youtube.com/watch?v=xxx\nhttps://vimeo.com/123456\nhttps://example.com/video.mp4"}
                        className="w-full px-4 py-3 border-2 rounded-lg text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors font-mono"
                        value={multiUrls}
                        onChange={(e) => setMultiUrls(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        ضع رابط كل فيديو في سطر منفصل — يمكنك مزج منصات مختلفة
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold mb-2">التصنيف (اختياري — تحديد تلقائي بالذكاء الاصطناعي)</label>
                    <select
                      className="w-full px-4 py-3 border-2 rounded-lg text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-indigo-500 outline-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">تحديد تلقائي</option>
                      <option value="برمجة">برمجة</option>
                      <option value="تصميم">تصميم</option>
                      <option value="تسويق">تسويق</option>
                      <option value="أعمال">أعمال</option>
                      <option value="لغات">لغات</option>
                      <option value="علوم">علوم</option>
                      <option value="رياضيات">رياضيات</option>
                      <option value="تطوير الذات">تطوير الذات</option>
                    </select>
                  </div>

                  {/* Supported platforms */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-sm">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">المنصات المدعومة:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-indigo-700 dark:text-indigo-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">▶️</span> YouTube (قوائم تشغيل + فيديو)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">🎬</span> Vimeo
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">🎓</span> Coursera
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">📚</span> Udemy
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">🧮</span> Khan Academy
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center">🔗</span> أي رابط فيديو مباشر
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1">ما سيحدث تلقائياً:</h4>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs">
                        <li>استخراج معلومات الفيديوهات من المنصة</li>
                        <li>ترجمة العنوان والوصف للعربية (محسّن SEO)</li>
                        <li>استخراج وترجمة الترجمة النصية (إن وجدت)</li>
                        <li>نشر الدورة جاهزة للمشاهدة</li>
                      </ol>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">
                      {error}
                    </div>
                  )}

                  {progress && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                      <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{progress}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                        قد تستغرق العملية عدة دقائق حسب عدد الفيديوهات...
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={loading || (mode === 'single' ? !url.trim() : !multiUrls.trim())}
                    className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all shadow-md"
                  >
                    {loading ? 'جاري الاستيراد والترجمة...' : '🚀 بدء الاستيراد والترجمة'}
                  </button>
                </div>
              )}

              {/* Results */}
              {results && courseInfo && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">{courseInfo.title}</h3>
                    <div className="flex justify-center gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-2xl font-bold text-green-600">{courseInfo.videosSucceeded}</span>
                        <p className="text-xs text-gray-500">فيديو ناجح</p>
                      </div>
                      {courseInfo.videosFailed > 0 && (
                        <div>
                          <span className="text-2xl font-bold text-red-600">{courseInfo.videosFailed}</span>
                          <p className="text-xs text-gray-500">فشل</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {results.map((r, i) => (
                      <div
                        key={r.videoId}
                        className={`p-3 rounded-lg border text-sm ${
                          r.status === 'success'
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-gray-400 mt-0.5">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{r.arabicTitle || r.originalTitle}</p>
                            <p className="text-xs text-gray-500 truncate" dir="ltr">{r.originalTitle}</p>
                            <div className="flex gap-2 mt-1">
                              {r.hasSubtitles && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                  ترجمة متزامنة ✓
                                </span>
                              )}
                              {r.status === 'error' && (
                                <span className="text-xs text-red-600">{r.error}</span>
                              )}
                            </div>
                          </div>
                          <span>{r.status === 'success' ? '✅' : '❌'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={`/courses/${courseInfo.id}`}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
                    >
                      عرض الدورة
                    </a>
                    <button
                      onClick={() => {
                        setResults(null);
                        setCourseInfo(null);
                        setUrl('');
                        setMultiUrls('');
                      }}
                      className="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
                    >
                      استيراد دورة أخرى
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
