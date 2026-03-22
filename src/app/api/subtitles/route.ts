import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/subtitles?contentId=xxx
 * Returns WebVTT subtitles for a course content item
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');

  if (!contentId) {
    return new NextResponse('Missing contentId', { status: 400 });
  }

  const content = await prisma.courseContent.findUnique({
    where: { id: contentId },
    select: { subtitlesVtt: true },
  });

  if (!content?.subtitlesVtt) {
    return new NextResponse('No subtitles', { status: 404 });
  }

  // Return as WebVTT with proper content type
  return new NextResponse(content.subtitlesVtt, {
    headers: {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
