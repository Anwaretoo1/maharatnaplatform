'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ImportResult {
  videoId: string;
  contentId?: string;
  originalTitle: string;
  arabicTitle?: string;
  hasSubtitles?: boolean;
  status: string;
  error?: string;
}

type ImportMode = 'single' | 'multi';

/**
 * Fetch YouTube transcript from the browser (client-side).
 * This bypasses server IP blocks because it runs from the admin's browser.
 * Uses a CORS proxy to access YouTube's InnerTube API.
 */
async function fetchTranscriptClientSide(videoId: string): Promise<Array<{start: number; duration: number; text: string}> | null> {
  try {
    // Method 1: Use InnerTube Android API (same as youtube-transcript package)
    const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '20.10.38',
          }
        },
        videoId,
      }),
    });

    if (!playerRes.ok) return null;
    const playerData = await playerRes.json();

    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) return null;

    // Get first available track (prefer English)
    let track = captionTracks.find((t: any) => t.languageCode === 'en');
    if (!track) track = captionTracks.find((t: any) => t.languageCode?.startsWith('en'));
    if (!track) track = captionTracks[0];

    if (!track?.baseUrl) return null;

    // Fetch the caption XML
    const captionRes = await fetch(track.baseUrl);
    if (!captionRes.ok) return null;

    const xml = await captionRes.text();

    // Parse XML captions
    const segments: Array<{start: number; duration: number; text: string}> = [];
    const regex = new RegExp('<text\\s+start="([\\d.]+)"\\s+dur="([\\d.]+)"[^>]*>(.*?)<\\/text>', 'gs');
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const text = match[3]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
      if (text) {
        segments.push({
          start: parseFloat(match[1]),
          duration: parseFloat(match[2]),
          text,
        });
      }
    }

    return segments.length > 0 ? segments : null;
  } catch (err) {
    console.log('[ClientCaptions] Error:', err);
    return null;
  }
}

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
  const [captionProgress, setCaptionProgress] = useState('');
  const router = useRouter();

  /**
   * After import: try to extract captions client-side for videos that didn't get subtitles
   */
  const extractCaptionsClientSide = useCallback(async (importResults: ImportResult[]) => {
    const videosWithoutSubs = importResults.filter(r =>
      r.status === 'success' && !r.hasSubtitles && r.videoId && r.contentId
    );

    if (videosWithoutSubs.length === 0) return importResults;

    setCaptionProgress(`جاري استخراج الترجمات من المتصفح (${videosWithoutSubs.length} فيديو)...`);
    const updatedResults = [...importResults];

    for (let i = 0; i < videosWithoutSubs.length; i++) {
      const video = videosWithoutSubs[i];
      setCaptionProgress(`استخراج ترجمة ${i + 1}/${videosWithoutSubs.length}: ${video.originalTitle?.substring(0, 40)}...`);

      try {
        // Extract captions from browser
        const captions = await fetchTranscriptClientSide(video.videoId);
        if (!captions || captions.length === 0) {
          console.log(`[ClientCaptions] No captions found for ${video.videoId}`);
          continue;
        }

        console.log(`[ClientCaptions] Got ${captions.length} segments for ${video.videoId}`);

        // Send to server for translation and saving
        setCaptionProgress(`ترجمة ${i + 1}/${videosWithoutSubs.length}: ${captions.length} مقطع...`);
        const res = await fetch('/api/admin/extract-captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: video.contentId,
            captions,
          }),
        });

        if (res.ok) {
          // Update results to show subtitles
          const idx = updatedResults.findIndex(r => r.videoId === video.videoId);
          if (idx >= 0) {
            updatedResults[idx] = { ...updatedResults[idx], hasSubtitles: true };
          }
        }
      } catch (err) {
        console.error(`[ClientCaptions] Error for ${video.videoId}:`, err);
      }
    }

    setCaptionProgress('');
    return updatedResults;
  }, []);

  const handleImport = async () => {
    const hasInput = mode === 'single' ? url.trim() : multiUrls.trim();
    if (!hasInput) return;

    setLoading(true);
    setError('');
    setResults(null);
    setCourseInfo(null);
    setCaptionProgress('');
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

      setProgress('جاري الاستيراد والترجمة على السيرفر...');

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

      // Check if any videos are missing subtitles
      const hasVideoWithoutSubs = data.results?.some((r: ImportResult) =>
        r.status === 'success' && !r.hasSubtitles
      );

      if (hasVideoWithoutSubs) {
        setProgress('');
        // Try client-side caption extraction for videos missing subtitles
        const updatedResults = await extractCaptionsClientSide(data.results);
        setResults(updatedResults);

        // Update course info with new subtitle counts
        const subsCount = updatedResults.filter((r: ImportResult) => r.hasSubtitles).length;
        setCourseInfo(prev => prev ? {
          ...prev,
          // Keep same values, subtitle info is in results
        } : null);
      } else {
        setResults(data.results);
      }

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
    setCaptionProgress('');
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
                    </div>
                  )}

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
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold mb-2">التصنيف (اختياري)</label>
                    <select
                      className="w-full px-4 py-3 border-2 rounded-lg text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-indigo-500 outline-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">تحديد تلقائي بالذكاء الاصطناعي</option>
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

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">
                      {error}
                    </div>
                  )}

                  {(progress || captionProgress) && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                      <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{captionProgress || progress}</p>
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
                      <div>
                        <span className="text-2xl font-bold text-blue-600">{results.filter(r => r.hasSubtitles).length}</span>
                        <p className="text-xs text-gray-500">مع ترجمة</p>
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
                              {r.hasSubtitles ? (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                  ترجمة عربية متزامنة ✓
                                </span>
                              ) : r.status === 'success' ? (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                  بدون ترجمة نصية
                                </span>
                              ) : null}
                              {r.status === 'error' && (
                                <span className="text-xs text-red-600">{r.error}</span>
                              )}
                            </div>
                          </div>
                          <span>{r.status === 'success' ? (r.hasSubtitles ? '✅' : '⚠️') : '❌'}</span>
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
