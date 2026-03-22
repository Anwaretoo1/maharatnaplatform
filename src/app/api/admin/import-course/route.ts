import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  extractPlaylistId,
  extractVideoId,
  fetchPlaylistVideos,
  fetchVideoDetails,
  fetchYouTubeCaptions,
  getYouTubeEmbedUrl,
} from '@/lib/youtube';
import {
  detectPlatform,
  processVideoUrls,
} from '@/lib/platforms';
import { transcribeYouTubeVideo } from '@/lib/transcribe';
import {
  translateCourseMetadata,
  translateVideoTitle,
  translateCaptions,
  translatedCaptionsToVtt,
} from '@/lib/translate';

export const maxDuration = 300; // 5 minutes for long processing

/**
 * POST /api/admin/import-course
 * Import course from YouTube, Vimeo, Coursera, Udemy, or any video URL
 *
 * Body: { url: string, category?: string, videoUrls?: string[] }
 * - url: single video or playlist URL
 * - videoUrls: array of video URLs (for manual multi-video import)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { url, category, videoUrls } = await request.json();

    if (!url && (!videoUrls || videoUrls.length === 0)) {
      return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح Anthropic API غير مُعد' }, { status: 500 });
    }

    const platform = url ? detectPlatform(url) : 'unknown';

    // ===== YOUTUBE =====
    if (platform === 'youtube') {
      return handleYouTubeImport(url, category, session.user.id);
    }

    // ===== OTHER PLATFORMS (Vimeo, Coursera, Udemy, direct, etc.) =====
    // Can be a single URL or multiple URLs
    const urlsToProcess = videoUrls && videoUrls.length > 0
      ? videoUrls
      : [url];

    return handleGenericImport(urlsToProcess, url, category, session.user.id);

  } catch (error) {
    console.error('Import course error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد' },
      { status: 500 }
    );
  }
}

/**
 * Handle YouTube playlist/video import
 */
async function handleYouTubeImport(url: string, category: string | undefined, userId: string) {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  // API key is optional - scraping works without it

  const playlistId = extractPlaylistId(url);
  const videoId = extractVideoId(url);

  if (!playlistId && !videoId) {
    return NextResponse.json({ error: 'رابط يوتيوب غير صالح' }, { status: 400 });
  }

  let videos;
  if (playlistId) {
    videos = await fetchPlaylistVideos(playlistId, youtubeApiKey);
  } else {
    const video = await fetchVideoDetails(videoId!, youtubeApiKey);
    if (!video) return NextResponse.json({ error: 'الفيديو غير موجود' }, { status: 404 });
    videos = [video];
  }

  if (videos.length === 0) {
    return NextResponse.json({ error: 'لم يتم العثور على فيديوهات' }, { status: 404 });
  }

  // Translate course metadata
  const playlistTitle = videos.length > 1
    ? videos[0].title.replace(/\s*[-–|#]\s*\d+.*$/, '').trim() || videos[0].title
    : videos[0].title;

  const metadata = await translateCourseMetadata(playlistTitle, videos[0].description, category);

  // Create course
  const course = await prisma.course.create({
    data: {
      title: metadata.title,
      description: metadata.description + (metadata.seoKeywords.length > 0
        ? `\n\nالكلمات المفتاحية: ${metadata.seoKeywords.join('، ')}` : ''),
      category: metadata.category,
      creatorId: userId,
      thumbnailUrl: videos[0].thumbnailUrl,
      isFree: true,
      isImported: true,
      sourcePlaylistUrl: url,
      originalLanguage: 'en',
      importStatus: 'processing',
    },
  });

  // Process each video
  // Process each video with 3-level caption fallback
  const results = [];
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    try {
      console.log(`[Import] Processing video ${i + 1}/${videos.length}: ${video.videoId} - ${video.title}`);
      const arabicTitle = await translateVideoTitle(video.title);

      // Level 1: Try YouTube captions (existing captions/auto-generated)
      let captions = await fetchYouTubeCaptions(video.videoId);
      let captionSource = 'youtube';
      console.log(`[Import] YouTube captions for ${video.videoId}: ${captions.length} segments`);

      // Level 2: If no YouTube captions, try AssemblyAI speech-to-text
      if (captions.length === 0 && process.env.ASSEMBLYAI_API_KEY) {
        console.log(`[Import] Trying AssemblyAI transcription for ${video.videoId}...`);
        captions = await transcribeYouTubeVideo(video.videoId);
        captionSource = 'assemblyai';
        console.log(`[Import] AssemblyAI for ${video.videoId}: ${captions.length} segments`);
      }

      // Translate captions if found from any source
      let subtitlesVtt: string | null = null;
      if (captions.length > 0) {
        console.log(`[Import] Translating ${captions.length} segments (source: ${captionSource}) for ${video.videoId}...`);
        const translatedCaps = await translateCaptions(captions);
        subtitlesVtt = translatedCaptionsToVtt(translatedCaps);
        console.log(`[Import] Translation complete for ${video.videoId}`);
      } else {
        console.log(`[Import] No captions available for ${video.videoId} from any source`);
      }

      const created = await prisma.courseContent.create({
        data: {
          courseId: course.id,
          title: arabicTitle,
          type: 'video',
          content: getYouTubeEmbedUrl(video.videoId),
          order: i + 1,
          subtitlesVtt,
          originalTitle: video.title,
          sourceVideoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        },
      });

      results.push({
        videoId: video.videoId,
        contentId: created.id,
        originalTitle: video.title,
        arabicTitle,
        hasSubtitles: !!subtitlesVtt,
        captionSource: subtitlesVtt ? captionSource : 'none',
        status: 'success',
      });
    } catch (error) {
      console.error(`[Import] Error processing video ${video.videoId}:`, error);
      results.push({
        videoId: video.videoId,
        originalTitle: video.title,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return finalizeCourse(course.id, metadata.title, results, userId);
}

/**
 * Handle generic platform import (Vimeo, Coursera, Udemy, direct URLs, etc.)
 */
async function handleGenericImport(urls: string[], sourceUrl: string, category: string | undefined, userId: string) {
  // Extract video info from all URLs
  const videos = await processVideoUrls(urls);

  if (videos.length === 0) {
    return NextResponse.json({ error: 'لم يتم العثور على فيديوهات في الروابط المقدمة' }, { status: 404 });
  }

  // Translate course metadata
  const courseTitle = videos.length > 1
    ? videos[0].title.replace(/\s*[-–|#]\s*\d+.*$/, '').trim() || videos[0].title
    : videos[0].title;

  const metadata = await translateCourseMetadata(courseTitle, videos[0].description, category);

  // Create course
  const course = await prisma.course.create({
    data: {
      title: metadata.title,
      description: metadata.description + (metadata.seoKeywords.length > 0
        ? `\n\nالكلمات المفتاحية: ${metadata.seoKeywords.join('، ')}` : ''),
      category: metadata.category,
      creatorId: userId,
      thumbnailUrl: videos[0].thumbnailUrl || '',
      isFree: true,
      isImported: true,
      sourcePlaylistUrl: sourceUrl,
      originalLanguage: 'en',
      importStatus: 'processing',
    },
  });

  // Process each video
  const results = [];
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    try {
      const arabicTitle = await translateVideoTitle(video.title);

      // For YouTube videos embedded in other platforms, try to get captions
      let subtitlesVtt: string | null = null;
      const ytId = video.embedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)?.[1];
      if (ytId) {
        const captions = await fetchYouTubeCaptions(ytId);
        if (captions.length > 0) {
          const translatedCaps = await translateCaptions(captions);
          subtitlesVtt = translatedCaptionsToVtt(translatedCaps);
        }
      }

      const created = await prisma.courseContent.create({
        data: {
          courseId: course.id,
          title: arabicTitle,
          type: 'video',
          content: video.embedUrl,
          order: i + 1,
          subtitlesVtt,
          originalTitle: video.title,
          sourceVideoUrl: video.originalUrl,
        },
      });

      results.push({
        videoId: video.videoId,
        contentId: created.id,
        originalTitle: video.title,
        arabicTitle,
        hasSubtitles: !!subtitlesVtt,
        status: 'success',
      });
    } catch (error) {
      console.error(`Error processing video ${video.originalUrl}:`, error);
      results.push({
        videoId: video.videoId,
        originalTitle: video.title,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return finalizeCourse(course.id, metadata.title, results, userId);
}

/**
 * Finalize course: update status, send notifications, return response
 */
async function finalizeCourse(courseId: string, title: string, results: any[], userId: string) {
  const successCount = results.filter(r => r.status === 'success').length;

  await prisma.course.update({
    where: { id: courseId },
    data: { importStatus: successCount > 0 ? 'completed' : 'failed' },
  });

  // Notify learners
  const allLearners = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true },
  });

  if (allLearners.length > 0) {
    await prisma.notification.createMany({
      data: allLearners.map((u) => ({
        userId: u.id,
        title: 'دورة مترجمة جديدة',
        message: `تم إضافة دورة مترجمة جديدة: "${title}"`,
        type: 'new_course',
        link: `/courses/${courseId}`,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    course: {
      id: courseId,
      title,
      videosProcessed: results.length,
      videosSucceeded: successCount,
      videosFailed: results.length - successCount,
    },
    results,
  });
}

/**
 * GET /api/admin/import-course
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const importedCourses = await prisma.course.findMany({
      where: { isImported: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { content: true, enrollments: true } } },
    });

    return NextResponse.json({ courses: importedCourses });
  } catch (error) {
    console.error('Error fetching imported courses:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
