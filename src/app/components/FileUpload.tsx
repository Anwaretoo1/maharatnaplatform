'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string; // e.g., 'image/*' or 'video/*' or 'image/*,video/*'
  label?: string;
  maxSizeMB?: number;
  currentUrl?: string;
}

export default function FileUpload({ onUploadComplete, accept = 'image/*,video/*', label, maxSizeMB = 100, currentUrl }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `حجم الملف يتجاوز الحد المسموح (${maxSizeMB}MB)`;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return 'نوع الملف غير مدعوم. يُسمح فقط بالصور والفيديوهات';
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

      // Simulate progress (since fetch doesn't have upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل رفع الملف');
      }

      const data = await res.json();
      setProgress(100);
      onUploadComplete(data.url);
      
      if (data.type === 'image') {
        setPreview(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفع الملف');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      onUploadComplete(text);
      if (text.match(/\.(jpg|jpeg|png|gif|webp)/i) || text.includes('drive.google.com')) {
        setPreview(text);
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-neutral-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
          }
          ${uploading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={handleUrlPaste}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="text-4xl animate-pulse">⏳</div>
            <p className="text-sm font-medium">جاري رفع {fileName}...</p>
            <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <img src={preview} alt="معاينة" className="max-h-32 mx-auto rounded-md object-contain" />
            <p className="text-xs text-green-600 font-medium">✅ تم الرفع بنجاح</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview(null); setFileName(''); }}
              className="text-xs text-red-500 hover:underline"
            >
              تغيير الملف
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">
              {accept?.includes('video') && accept?.includes('image') ? '📁' :
               accept?.includes('video') ? '🎬' : '🖼️'}
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              اسحب الملف وأفلته هنا
            </p>
            <p className="text-xs text-gray-500">أو</p>
            <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors">
              تصفح الملفات
            </span>
            <p className="text-xs text-gray-400 mt-2">
              {accept?.includes('video') ? `فيديو أو صورة - الحد الأقصى ${maxSizeMB}MB` : `صورة - الحد الأقصى ${maxSizeMB}MB`}
            </p>
            <p className="text-xs text-gray-400">
              💡 يمكنك أيضاً لصق رابط Google Drive أو رابط مباشر
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
          ❌ {error}
        </p>
      )}
    </div>
  );
}
