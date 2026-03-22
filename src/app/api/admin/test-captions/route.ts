import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchYouTubeCaptions } from '@/lib/youtube';
import { transcribeYouTubeVideo } from '@/lib/transcribe';

export const maxDuration = 300; // 5 min for AssemblyAI transcription

/**
 * GET /api/admin/test-captions?videoId=dQw4w9WgXcQ
 * Test ALL caption extraction methods and report results
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const videoId = request.nextUrl.searchParams.get('videoId') || 'dQw4w9WgXcQ';
    const results: Record<string, any> = { videoId };

    // Test 1: Direct caption extraction (YouTube captions)
    console.log(`[Test] Testing YouTube caption extraction for ${videoId}...`);
    const t1 = Date.now();
    const ytCaptions = await fetchYouTubeCaptions(videoId);
    results.youtube = {
      success: ytCaptions.length > 0,
      segments: ytCaptions.length,
      elapsedMs: Date.now() - t1,
      sample: ytCaptions.slice(0, 3),
    };

    // Test 2: AssemblyAI transcription
    if (process.env.ASSEMBLYAI_API_KEY) {
      console.log(`[Test] Testing AssemblyAI transcription for ${videoId}...`);
      const t2 = Date.now();
      const aiCaptions = await transcribeYouTubeVideo(videoId);
      results.assemblyai = {
        success: aiCaptions.length > 0,
        segments: aiCaptions.length,
        elapsedMs: Date.now() - t2,
        sample: aiCaptions.slice(0, 3),
      };
    } else {
      results.assemblyai = { success: false, error: 'ASSEMBLYAI_API_KEY not configured' };
    }

    // Overall result
    const totalSegments = ytCaptions.length + (results.assemblyai?.segments || 0);
    results.overall = {
      success: totalSegments > 0,
      bestSource: ytCaptions.length > 0 ? 'youtube' : (results.assemblyai?.success ? 'assemblyai' : 'none'),
      message: totalSegments > 0
        ? `✅ نجح! يوتيوب: ${ytCaptions.length} مقطع، AssemblyAI: ${results.assemblyai?.segments || 0} مقطع`
        : '❌ فشل كل الطرق',
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
