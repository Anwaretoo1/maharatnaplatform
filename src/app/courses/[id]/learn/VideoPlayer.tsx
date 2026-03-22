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
  if (parts.length === 2) {
    const [m, sMs] = parts;
    const [s, ms] = sMs.split('.');
    return parseInt(m) * 60 + parseInt(s) + (parseInt(ms || '0') / 1000);
  }
  return 0;
}

// Extract YouTube video ID from embed URL
function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ course, initialProgress }: { course: any, initialProgress: any[], userId?: string }) {
  const [activeContent, setActiveContent] = useState(course.content[0]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialProgress.filter(p => p.isCompleted).map(p => p.courseContentId)));

  // Subtitle state
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [subtitleDebug, setSubtitleDebug] = useState('');

  // YouTube Player refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytApiLoadedRef = useRef(false);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      ytApiLoadedRef.current = true;
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoadedRef.current = true;
    };
  }, []);

  // Load subtitles when active content changes
  useEffect(() => {
    setSubtitles([]);
    setCurrentSubtitle('');
    setSubtitleDebug('');

    if (activeContent?.subtitlesVtt) {
      const cues = parseVtt(activeContent.subtitlesVtt);
      setSubtitles(cues);
      setSubtitleDebug(`تم تحميل ${cues.length} مقطع ترجمة`);
    } else if (activeContent?.id) {
      fetch(`/api/subtitles?contentId=${activeContent.id}`)
        .then(res => {
          if (res.ok) return res.text();
          return null;
        })
        .then(vtt => {
          if (vtt && vtt.startsWith('WEBVTT')) {
            const cues = parseVtt(vtt);
            setSubtitles(cues);
            setSubtitleDebug(`تم تحميل ${cues.length} مقطع ترجمة من API`);
          }
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

  // Create/recreate YouTube player when content changes
  const initYouTubePlayer = useCallback((videoId: string) => {
    // Clean up previous player
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch {}
      ytPlayerRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    const createPlayer = () => {
      if (!playerContainerRef.current || !window.YT?.Player) return;

      // Create a div for the player
      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-player-' + videoId;
      playerContainerRef.current.innerHTML = '';
      playerContainerRef.current.appendChild(playerDiv);

      ytPlayerRef.current = new window.YT.Player(playerDiv.id, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0, // Don't show YouTube's own captions
          hl: 'ar',
        },
        events: {
          onReady: () => {
            // Start polling current time
            timeIntervalRef.current = setInterval(() => {
              if (ytPlayerRef.current?.getCurrentTime) {
                const t = ytPlayerRef.current.getCurrentTime();
                setVideoTime(t);
              }
            }, 200);
          },
          onStateChange: (event: any) => {
            // When playing, ensure time polling is active
            if (event.data === 1 && !timeIntervalRef.current) {
              timeIntervalRef.current = setInterval(() => {
                if (ytPlayerRef.current?.getCurrentTime) {
                  setVideoTime(ytPlayerRef.current.getCurrentTime());
                }
              }, 200);
            }
          },
        },
      });
    };

    // Wait for API to be ready
    if (window.YT?.Player) {
      createPlayer();
    } else {
      const checkInterval = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(checkInterval);
          createPlayer();
        }
      }, 100);
      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
      }
    };
  }, []);

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

  const getContentUrl = (content: any) => {
    return getDisplayUrl(content.content, content.type);
  };

  const renderContent = () => {
    if (!activeContent) return <div className="text-white">اختر درساً للبدء</div>;

    const url = getContentUrl(activeContent);
    const hasSubtitles = subtitles.length > 0;
    const isYouTubeEmbed = activeContent.content?.includes('youtube.com/embed') || activeContent.content?.includes('youtube.com') || activeContent.content?.includes('youtu.be');
    const youtubeVideoId = isYouTubeEmbed ? getYouTubeVideoId(activeContent.content) : null;

    if (activeContent.type === 'video') {
      // YouTube video - use IFrame Player API for proper time sync
      if (youtubeVideoId) {
        return (
          <div className="relative w-full h-full">
            <div
              ref={playerContainerRef}
              className="w-full h-full"
              key={youtubeVideoId}
            />
            {/* Initialize player */}
            <PlayerInitializer videoId={youtubeVideoId} onInit={initYouTubePlayer} />
            {/* Arabic subtitle overlay */}
            {hasSubtitles && showSubtitles && currentSubtitle && (
              <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-4 z-10">
                <div className="bg-black/85 text-white text-base md:text-lg px-5 py-2.5 rounded-lg max-w-[90%] text-center leading-relaxed font-medium shadow-lg" dir="rtl">
                  {currentSubtitle}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Google Drive - use iframe
      if (isDriveUrl(activeContent.content)) {
        return (
          <iframe
            src={url}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title={activeContent.title}
          />
        );
      }

      // Direct video (mp4, etc.)
      return (
        <div className="relative w-full h-full">
          <video
            controls
            className="w-full h-full"
            src={url}
            onTimeUpdate={(e) => setVideoTime((e.target as HTMLVideoElement).currentTime)}
          >
            <source src={url} />
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
          {hasSubtitles && showSubtitles && currentSubtitle && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-4">
              <div className="bg-black/85 text-white text-base md:text-lg px-5 py-2.5 rounded-lg max-w-[90%] text-center leading-relaxed font-medium shadow-lg" dir="rtl">
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

// Small helper component to trigger player initialization
function PlayerInitializer({ videoId, onInit }: { videoId: string; onInit: (id: string) => void }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      onInit(videoId);
    }
    return () => { initialized.current = false; };
  }, [videoId, onInit]);

  return null;
}
