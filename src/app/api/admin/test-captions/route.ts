import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchYouTubeCaptions } from '@/lib/youtube';

/**
 * GET /api/admin/test-captions?videoId=dQw4w9WgXcQ
 * Test if caption extraction works on this server
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const videoId = request.nextUrl.searchParams.get('videoId') || 'dQw4w9WgXcQ';

    console.log(`[Test] Starting caption extraction for ${videoId}...`);
    const startTime = Date.now();

    const captions = await fetchYouTubeCaptions(videoId);
    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: captions.length > 0,
      videoId,
      segmentsCount: captions.length,
      elapsedMs: elapsed,
      sample: captions.slice(0, 5),
      message: captions.length > 0
        ? `نجح استخراج ${captions.length} مقطع ترجمة في ${elapsed}ms`
        : 'فشل استخراج الترجمة - YouTube قد يحظر عنوان IP هذا السيرفر',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
