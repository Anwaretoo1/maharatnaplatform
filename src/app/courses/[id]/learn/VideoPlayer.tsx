'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getDisplayUrl, isDriveUrl } from '@/lib/driveUtils';

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseVtt(vttText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = vttText.split('\n\n');

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const timeLine = lines[i];
      if (timeLine.includes('-->')) {
        const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
        const text = lines.slice(i + 1).join(' ').trim();
        if (text) {
          cues.push({
            start: parseVttTime(startStr),
            end: parseVttTime(endStr),
            text,
          });
        }
        break;
      }
    }
  }
  return cues;
}

function parseVttTime(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const [h, m, sMs] = parts;
    const [s, ms] = sMs.split('.');
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + (parseInt(ms || '0') / 1000);
  }
  return 0;
}

export default function VideoPlayer({ course, initialProgress }: { course: any, initialProgress: any[], userId?: string }) {
  const [activeContent, setActiveContent] = useState(course.content[0]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialProgress.filter(p => p.isCompleted).map(p => p.courseContentId)));

  // Subtitle state
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const subtitleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load subtitles when active content changes
  useEffect(() => {
    setSubtitles([]);
    setCurrentSubtitle('');

    if (activeContent?.subtitlesVtt) {
      // Subtitles are inline (passed from server)
      const cues = parseVtt(activeContent.subtitlesVtt);
      setSubtitles(cues);
    } else if (activeContent?.id) {
      // Try to fetch from API
      fetch(`/api/subtitles?contentId=${activeContent.id}`)
        .then(res => {
          if (res.ok) return res.text();
          return null;
        })
        .then(vtt => {
          if (vtt) setSubtitles(parseVtt(vtt));
        })
        .catch(() => {});
    }
  }, [activeContent?.id, activeContent?.subtitlesVtt]);

  // Update current subtitle based on video time
  useEffect(() => {
    if (subtitles.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const cue = subtitles.find(c => videoTime >= c.start && videoTime <= c.end);
    setCurrentSubtitle(cue?.text || '');
  }, [videoTime, subtitles]);

  // YouTube iframe API integration for subtitle sync
  useEffect(() => {
    if (subtitles.length === 0) return;

    // For YouTube embeds, we use postMessage to get current time
    const isYouTube = activeContent?.content?.includes('youtube.com') || activeContent?.content?.includes('youtu.be');
    if (!isYouTube) return;

    // Listen for YouTube player state messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
          setVideoTime(data.info.currentTime);
        }
      } catch {
        // Not a YouTube message
      }
    };

    window.addEventListener('message', handleMessage);

    // Request time updates from YouTube iframe
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening' }),
          '*'
        );
      }
    }, 250);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [subtitles, activeContent]);

  const handleMarkComplete = async (contentId: string) => {
    try {
      const newCompleted = new Set(completedIds);
      newCompleted.add(contentId);
      setCompletedIds(newCompleted);

      await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, isCompleted: true })
      });
    } catch (error) {
      console.error('Failed to save progress', error);
    }
  };

  // تحويل الروابط للعرض المباشر
  const getContentUrl = (content: any) => {
    return getDisplayUrl(content.content, content.type);
  };

  const renderContent = () => {
    if (!activeContent) return <div className="text-white">اختر درساً للبدء</div>;

    const url = getContentUrl(activeContent);
    const hasSubtitles = subtitles.length > 0;

    if (activeContent.type === 'video') {
      // Google Drive أو YouTube - استخدام iframe
      if (isDriveUrl(activeContent.content) || activeContent.content.includes('youtube.com') || activeContent.content.includes('youtu.be')) {
        // Add enablejsapi for YouTube to allow subtitle sync
        const embedUrl = activeContent.content.includes('youtube.com/embed')
          ? `${url}${url.includes('?') ? '&' : '?'}enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
          : url;

        return (
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title={activeContent.title}
            />
            {/* Arabic subtitle overlay */}
            {hasSubtitles && showSubtitles && currentSubtitle && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none px-4">
                <div className="bg-black/80 text-white text-lg md:text-xl px-6 py-3 rounded-lg max-w-[90%] text-center leading-relaxed font-medium" dir="rtl">
                  {currentSubtitle}
                </div>
              </div>
            )}
          </div>
        );
      }
      // فيديو مباشر (رابط mp4 مثلاً)
      return (
        <div className="relative w-full h-full">
          <video
            controls
            className="w-full h-full"
            src={url}
            onTimeUpdate={(e) => setVideoTime((e.target as HTMLVideoElement).currentTime)}
          >
            <source src={url} />
            {/* Add VTT track if available */}
            {hasSubtitles && (
              <track
                kind="subtitles"
                srcLang="ar"
                label="العربية"
                src={`/api/subtitles?contentId=${activeContent.id}`}
                default
              />
            )}
            المتصفح لا يدعم تشغيل الفيديو
          </video>
          {/* Fallback subtitle overlay for direct videos */}
          {hasSubtitles && showSubtitles && currentSubtitle && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-4">
              <div className="bg-black/80 text-white text-lg md:text-xl px-6 py-3 rounded-lg max-w-[90%] text-center leading-relaxed font-medium" dir="rtl">
                {currentSubtitle}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeContent.type === 'image') {
      return <img src={url} alt={activeContent.title} className="max-h-full max-w-full object-contain" />;
    }

    // نص
    return (
      <div className="p-8 text-white overflow-auto h-full w-full">
        <h2 className="text-2xl font-bold mb-4">{activeContent.title}</h2>
        <p className="whitespace-pre-wrap">{activeContent.content}</p>
      </div>
    );
  };

  const hasSubtitlesForCurrent = subtitles.length > 0;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Video/Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-black w-full aspect-video flex items-center justify-center relative">
          {renderContent()}
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl font-bold">{activeContent?.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 text-sm">{course.title}</p>
              {activeContent?.originalTitle && (
                <p className="text-gray-400 text-xs" dir="ltr">({activeContent.originalTitle})</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle subtitles button */}
            {hasSubtitlesForCurrent && (
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  showSubtitles
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400'
                }`}
                title={showSubtitles ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
              >
                {showSubtitles ? '🔤 ترجمة' : '🔤'}
              </button>
            )}
            <button
              onClick={() => activeContent && handleMarkComplete(activeContent.id)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeContent && completedIds.has(activeContent.id)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {activeContent && completedIds.has(activeContent.id) ? 'مكتمل ✓' : 'تحديد كمكتمل'}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar List */}
      <div className="w-full lg:w-80 bg-gray-50 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 overflow-y-auto h-full">
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="font-bold text-lg">محتوى الدورة</h2>
          {course.isImported && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">🌍 دورة مترجمة تلقائياً</p>
          )}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedIds.size / course.content.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-left">
            {Math.round((completedIds.size / course.content.length) * 100)}% مكتمل
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-neutral-800">
          {course.content.map((item: any, index: number) => (
            <button
              key={item.id}
              onClick={() => setActiveContent(item)}
              className={`w-full text-right p-4 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-start gap-3 ${
                activeContent?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/10 border-r-4 border-blue-600' : ''
              }`}
            >
              <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                completedIds.has(item.id)
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-400 text-transparent'
              }`}>
                <span className="text-xs">✓</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${completedIds.has(item.id) ? 'text-gray-500 line-through' : ''}`}>
                  {index + 1}. {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-400">{item.type === 'video' ? '🎬 فيديو' : item.type === 'image' ? '🖼️ صورة' : '📝 نص'}</p>
                  {item.subtitlesVtt && (
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">مترجم</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 mt-auto">
          <Link href="/dashboard/learner" className="block w-full text-center py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm">
            الخروج من الدورة
          </Link>
        </div>
      </div>
    </div>
  );
}
