import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchYouTubeCaptions } from '@/lib/youtube';
import { transcribeYouTubeVideo } from '@/lib/transcribe';

export const maxDuration = 300;

/**
 * GET /api/admin/test-captions?videoId=xxx
 * Test ALL methods and show detailed diagnostics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const videoId = request.nextUrl.searchParams.get('videoId') || 'dQw4w9WgXcQ';
    const skipAssembly = request.nextUrl.searchParams.get('skipAssembly') === 'true';
    const results: Record<string, any> = { videoId };

    // Environment check
    results.env = {
      SUPADATA_API_KEY: process.env.SUPADATA_API_KEY ? '✓ set' : '✗ missing',
      ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY ? '✓ set' : '✗ missing',
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ? '✓ set' : '✗ missing',
    };

    // Test 1: YouTube captions (includes Supadata + direct + youtube-transcript)
    console.log(`[Test] Testing caption extraction for ${videoId}...`);
    const t1 = Date.now();
    const ytCaptions = await fetchYouTubeCaptions(videoId);
    results.captions = {
      success: ytCaptions.length > 0,
      segments: ytCaptions.length,
      elapsedMs: Date.now() - t1,
      sample: ytCaptions.slice(0, 3),
    };

    // Test 2: AssemblyAI (only if captions failed and not skipped)
    if (!skipAssembly && ytCaptions.length === 0 && process.env.ASSEMBLYAI_API_KEY) {
      console.log(`[Test] Captions failed, testing AssemblyAI for ${videoId}...`);
      const t2 = Date.now();
      const aiCaptions = await transcribeYouTubeVideo(videoId);
      results.assemblyai = {
        success: aiCaptions.length > 0,
        segments: aiCaptions.length,
        elapsedMs: Date.now() - t2,
        sample: aiCaptions.slice(0, 3),
      };
    } else if (ytCaptions.length > 0) {
      results.assemblyai = { skipped: true, reason: 'captions already found' };
    } else if (skipAssembly) {
      results.assemblyai = { skipped: true, reason: 'skipAssembly=true' };
    } else {
      results.assemblyai = { skipped: true, reason: 'ASSEMBLYAI_API_KEY not set' };
    }

    // Overall
    const captionSource = ytCaptions.length > 0 ? 'captions' : (results.assemblyai?.success ? 'assemblyai' : 'none');
    const totalSegments = ytCaptions.length || results.assemblyai?.segments || 0;
    results.overall = {
      success: totalSegments > 0,
      bestSource: captionSource,
      totalSegments,
      message: totalSegments > 0
        ? `✅ نجح! ${totalSegments} مقطع من ${captionSource}`
        : '❌ فشل - تأكد من إضافة SUPADATA_API_KEY',
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    }, { status: 500 });
  }
}
