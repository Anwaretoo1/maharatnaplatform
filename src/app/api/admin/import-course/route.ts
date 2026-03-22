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
  translateCourseMetadata,
  translateVideoTitle,
  translateCaptions,
  translatedCaptionsToVtt,
} from '@/lib/translate';

export const maxDuration = 300; // 5 minutes for long processing

/**
 * POST /api/admin/import-course
 * Import a YouTube playlist or single video as a course with Arabic translation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { url, category } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return NextResponse.json({ error: 'مفتاح YouTube API غير مُعد' }, { status: 500 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح Anthropic API غير مُعد' }, { status: 500 });
    }

    // Determine if it's a playlist or single video
    const playlistId = extractPlaylistId(url);
    const videoId = extractVideoId(url);

    if (!playlistId && !videoId) {
      return NextResponse.json(
        { error: 'رابط غير صالح. يرجى إدخال رابط قائمة تشغيل أو فيديو يوتيوب.' },
        { status: 400 }
      );
    }

    // Fetch videos
    let videos;
    if (playlistId) {
      videos = await fetchPlaylistVideos(playlistId, youtubeApiKey);
    } else {
      const video = await fetchVideoDetails(videoId!, youtubeApiKey);
      if (!video) {
        return NextResponse.json({ error: 'الفيديو غير موجود' }, { status: 404 });
      }
      videos = [video];
    }

    if (videos.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على فيديوهات' }, { status: 404 });
    }

    // Step 1: Translate course metadata using the first video's info
    const playlistTitle = videos.length > 1
      ? videos[0].title.replace(/\s*[-–|#]\s*\d+.*$/, '').trim() || videos[0].title
      : videos[0].title;
    const playlistDescription = videos[0].description;

    const metadata = await translateCourseMetadata(
      playlistTitle,
      playlistDescription,
      category
    );

    // Step 2: Create the course record
    const course = await prisma.course.create({
      data: {
        title: metadata.title,
        description: metadata.description + (metadata.seoKeywords.length > 0
          ? `\n\nالكلمات المفتاحية: ${metadata.seoKeywords.join('، ')}`
          : ''),
        category: metadata.category,
        creatorId: session.user.id,
        thumbnailUrl: videos[0].thumbnailUrl,
        isFree: true,
        isImported: true,
        sourcePlaylistUrl: url,
        originalLanguage: 'en',
        importStatus: 'processing',
      },
    });

    // Step 3: Process each video — translate title + captions
    const results = [];
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      try {
        // Translate video title
        const arabicTitle = await translateVideoTitle(video.title);

        // Fetch captions from YouTube
        const captions = await fetchYouTubeCaptions(video.videoId);

        // Translate captions if available
        let subtitlesVtt: string | null = null;
        if (captions.length > 0) {
          const translatedCaps = await translateCaptions(captions);
          subtitlesVtt = translatedCaptionsToVtt(translatedCaps);
        }

        // Create course content
        const content = await prisma.courseContent.create({
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
          originalTitle: video.title,
          arabicTitle,
          hasSubtitles: !!subtitlesVtt,
          status: 'success',
        });
      } catch (error) {
        console.error(`Error processing video ${video.videoId}:`, error);
        results.push({
          videoId: video.videoId,
          originalTitle: video.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update course status
    const successCount = results.filter(r => r.status === 'success').length;
    await prisma.course.update({
      where: { id: course.id },
      data: {
        importStatus: successCount > 0 ? 'completed' : 'failed',
      },
    });

    // Notify all learners about the new course
    const allLearners = await prisma.user.findMany({
      where: { id: { not: session.user.id } },
      select: { id: true },
    });

    if (allLearners.length > 0) {
      await prisma.notification.createMany({
        data: allLearners.map((u) => ({
          userId: u.id,
          title: 'دورة مترجمة جديدة',
          message: `تم إضافة دورة مترجمة جديدة: "${metadata.title}"`,
          type: 'new_course',
          link: `/courses/${course.id}`,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: metadata.title,
        videosProcessed: results.length,
        videosSucceeded: successCount,
        videosFailed: results.length - successCount,
      },
      results,
    });

  } catch (error) {
    console.error('Import course error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import-course
 * Get list of imported courses with their status
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
      include: {
        _count: { select: { content: true, enrollments: true } },
      },
    });

    return NextResponse.json({ courses: importedCourses });
  } catch (error) {
    console.error('Error fetching imported courses:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
