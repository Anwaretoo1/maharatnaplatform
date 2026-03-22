import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseSrt, parseVtt } from '@/lib/youtube';
import { translateCaptions, translatedCaptionsToVtt } from '@/lib/translate';

export const maxDuration = 120;

/**
 * POST /api/admin/subtitles
 * Upload and translate subtitles for a course content item
 * Body: { contentId: string, subtitleText: string, format: 'srt' | 'vtt', skipTranslation?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { contentId, subtitleText, format, skipTranslation } = await request.json();

    if (!contentId || !subtitleText) {
      return NextResponse.json({ error: 'معرف المحتوى ونص الترجمة مطلوبان' }, { status: 400 });
    }

    // Verify content exists
    const content = await prisma.courseContent.findUnique({ where: { id: contentId } });
    if (!content) {
      return NextResponse.json({ error: 'المحتوى غير موجود' }, { status: 404 });
    }

    // Parse subtitles
    const segments = format === 'srt' ? parseSrt(subtitleText) : parseVtt(subtitleText);
    if (segments.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على ترجمات في الملف' }, { status: 400 });
    }

    let finalVtt: string;

    if (skipTranslation) {
      // Already in Arabic - just convert to VTT
      let vtt = 'WEBVTT\n\n';
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const startTime = formatTime(seg.start);
        const endTime = formatTime(seg.start + seg.duration);
        vtt += `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n\n`;
      }
      finalVtt = vtt;
    } else {
      // Translate to Arabic using Claude
      const translated = await translateCaptions(segments);
      finalVtt = translatedCaptionsToVtt(translated);
    }

    // Save to database
    await prisma.courseContent.update({
      where: { id: contentId },
      data: { subtitlesVtt: finalVtt },
    });

    return NextResponse.json({
      success: true,
      segmentsCount: segments.length,
      message: `تم ${skipTranslation ? 'حفظ' : 'ترجمة وحفظ'} ${segments.length} جزء من الترجمة`,
    });

  } catch (error) {
    console.error('Subtitle upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/subtitles?courseId=xxx
 * Get all content items for a course with subtitle status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 });
    }

    const contents = await prisma.courseContent.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        order: true,
        type: true,
        subtitlesVtt: true,
        sourceVideoUrl: true,
      },
    });

    return NextResponse.json({
      contents: contents.map(c => ({
        ...c,
        hasSubtitles: !!c.subtitlesVtt,
        subtitlesVtt: undefined, // Don't send full VTT in list
      })),
    });

  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
