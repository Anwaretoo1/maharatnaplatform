/**
 * تحويل روابط Google Drive إلى روابط مباشرة قابلة للعرض
 * 
 * أنواع الروابط المدعومة:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */

// استخراج معرف الملف من رابط Google Drive
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Pattern 1: /file/d/FILE_ID/
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  
  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  
  return null;
}

// هل الرابط من Google Drive؟
export function isDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

// تحويل رابط Drive إلى رابط صورة مباشر
export function getDriveImageUrl(url: string): string {
  if (!isDriveUrl(url)) return url;
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

// تحويل رابط Drive إلى رابط فيديو للتضمين (iframe)
export function getDriveVideoEmbedUrl(url: string): string {
  if (!isDriveUrl(url)) return url;
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// تحويل رابط Drive إلى رابط تحميل مباشر
export function getDriveDirectUrl(url: string): string {
  if (!isDriveUrl(url)) return url;
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// هل الرابط من YouTube؟
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

// تحويل رابط YouTube إلى رابط تضمين
export function getYouTubeEmbedUrl(url: string): string {
  if (!isYouTubeUrl(url)) return url;
  
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  
  // youtube.com/watch?v=VIDEO_ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  
  // Already embed URL
  if (url.includes('/embed/')) return url;
  
  return url;
}

// تحويل أي رابط محتوى للعرض المباشر حسب النوع
export function getDisplayUrl(url: string, type: 'video' | 'image' | 'text'): string {
  if (type === 'image') {
    return getDriveImageUrl(url);
  }
  if (type === 'video') {
    if (isDriveUrl(url)) return getDriveVideoEmbedUrl(url);
    if (isYouTubeUrl(url)) return getYouTubeEmbedUrl(url);
    return url;
  }
  return url;
}
