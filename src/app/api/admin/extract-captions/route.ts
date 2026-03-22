import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { translateCaptions, translatedCaptionsToVtt } from '@/lib/translate';

export const maxDuration = 120;

/**
 * POST /api/admin/extract-captions
 * Receives raw English captions from client-side extraction,
 * translates them to Arabic, and saves to database.
 *
 * Body: { contentId: string, captions: Array<{start: number, duration: number, text: string}> }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { contentId, captions } = await request.json();

    if (!contentId || !captions || captions.length === 0) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    const content = await prisma.courseContent.findUnique({ where: { id: contentId } });
    if (!content) {
      return NextResponse.json({ error: 'المحتوى غير موجود' }, { status: 404 });
    }

    // Translate captions to Arabic
    const translated = await translateCaptions(captions);
    const vtt = translatedCaptionsToVtt(translated);

    // Save to database
    await prisma.courseContent.update({
      where: { id: contentId },
      data: { subtitlesVtt: vtt },
    });

    return NextResponse.json({
      success: true,
      segmentsCount: translated.length,
      message: `تم ترجمة وحفظ ${translated.length} مقطع ترجمة`,
    });
  } catch (error) {
    console.error('Extract captions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ' },
      { status: 500 }
    );
  }
}
