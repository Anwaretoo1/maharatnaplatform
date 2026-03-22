import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchYouTubeCaptions } from '@/lib/youtube';

export const maxDuration = 60;

/**
 * POST /api/admin/fetch-full-captions
 * Fetch full captions for a YouTube video (used by client-side fallback)
 * Body: { videoId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { videoId } = await request.json();
    if (!videoId) {
      return NextResponse.json({ error: 'videoId مطلوب' }, { status: 400 });
    }

    console.log(`[FetchCaptions] Fetching captions for ${videoId}...`);
    const captions = await fetchYouTubeCaptions(videoId);

    if (captions.length === 0) {
      return NextResponse.json({
        success: false,
        captions: [],
        message: 'لم يتم العثور على ترجمة لهذا الفيديو',
      });
    }

    return NextResponse.json({
      success: true,
      captions,
      count: captions.length,
    });
  } catch (error) {
    console.error('Fetch captions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ' },
      { status: 500 }
    );
  }
}
