'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getDisplayUrl, isDriveUrl } from '@/lib/driveUtils';

export default function VideoPlayer({ course, initialProgress }: { course: any, initialProgress: any[], userId?: string }) {
  const [activeContent, setActiveContent] = useState(course.content[0]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialProgress.filter(p => p.isCompleted).map(p => p.courseContentId)));

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

    if (activeContent.type === 'video') {
      // Google Drive أو YouTube - استخدام iframe
      if (isDriveUrl(activeContent.content) || activeContent.content.includes('youtube.com') || activeContent.content.includes('youtu.be')) {
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
      // فيديو مباشر (رابط mp4 مثلاً)
      return (
        <video controls className="w-full h-full" src={url}>
          <source src={url} />
          المتصفح لا يدعم تشغيل الفيديو
        </video>
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

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Video/Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-black w-full aspect-video flex items-center justify-center">
          {renderContent()}
        </div>
        
        <div className="p-6 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{activeContent?.title}</h1>
            <p className="text-gray-500 text-sm">{course.title}</p>
          </div>
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

      {/* Sidebar List */}
      <div className="w-full lg:w-80 bg-gray-50 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 overflow-y-auto h-full">
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="font-bold text-lg">محتوى الدورة</h2>
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
              <div>
                <p className={`text-sm font-medium ${completedIds.has(item.id) ? 'text-gray-500 line-through' : ''}`}>
                  {index + 1}. {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">{item.type === 'video' ? '🎬 فيديو' : item.type === 'image' ? '🖼️ صورة' : '📝 نص'}</p>
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
