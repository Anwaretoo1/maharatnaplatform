/**
 * YouTube utilities for extracting playlist/video data and captions
 */

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  position: number;
}

export interface YouTubeCaptionSegment {
  start: number; // seconds
  duration: number;
  text: string;
}

/**
 * Extract playlist ID from various YouTube playlist URL formats
 */
export function extractPlaylistId(url: string): string | null {
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /playlist\?list=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch playlist videos using YouTube Data API v3
 */
export async function fetchPlaylistVideos(playlistId: string, apiKey: string): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let nextPageToken = '';

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(`YouTube API error: ${error.error?.message || res.statusText}`);
    }

    const data = await res.json();

    for (const item of data.items || []) {
      const snippet = item.snippet;
      if (snippet.resourceId?.videoId) {
        videos.push({
          videoId: snippet.resourceId.videoId,
          title: snippet.title,
          description: snippet.description || '',
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
          position: snippet.position,
        });
      }
    }

    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  return videos.sort((a, b) => a.position - b.position);
}

/**
 * Fetch single video details
 */
export async function fetchVideoDetails(videoId: string, apiKey: string): Promise<YouTubeVideo | null> {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description || '',
    thumbnailUrl: item.snippet.thumbnails?.high?.url || '',
    position: 0,
  };
}

/**
 * Fetch YouTube auto-generated captions using timedtext API
 * Returns raw caption segments with timestamps
 */
export async function fetchYouTubeCaptions(videoId: string, lang: string = 'en'): Promise<YouTubeCaptionSegment[]> {
  // Try to get captions list from YouTube's innertube
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(watchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch video page: ${res.statusText}`);

  const html = await res.text();

  // Extract captions URL from the page
  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) {
    // No captions available
    return [];
  }

  let captionTracks;
  try {
    captionTracks = JSON.parse(captionMatch[1]);
  } catch {
    return [];
  }

  // Find the requested language or auto-generated version
  let captionUrl = '';
  for (const track of captionTracks) {
    if (track.languageCode === lang) {
      captionUrl = track.baseUrl;
      break;
    }
  }

  // Fallback: try any available caption
  if (!captionUrl && captionTracks.length > 0) {
    captionUrl = captionTracks[0].baseUrl;
  }

  if (!captionUrl) return [];

  // Fetch the actual captions in srv3 (XML) format
  const captionRes = await fetch(`${captionUrl}&fmt=srv3`);
  if (!captionRes.ok) return [];

  const xml = await captionRes.text();
  return parseSrv3Captions(xml);
}

/**
 * Parse YouTube srv3 caption XML format
 */
function parseSrv3Captions(xml: string): YouTubeCaptionSegment[] {
  const segments: YouTubeCaptionSegment[] = [];
  // Match <p t="start_ms" d="duration_ms">text</p>
  const regex = new RegExp('<p\\s+t="(\\d+)"\\s+d="(\\d+)"[^>]*>(.*?)</p>', 'gs');
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const startMs = parseInt(match[1]);
    const durationMs = parseInt(match[2]);
    // Clean HTML tags from text
    const text = match[3]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (text) {
      segments.push({
        start: startMs / 1000,
        duration: durationMs / 1000,
        text,
      });
    }
  }

  return segments;
}

/**
 * Convert caption segments to WebVTT format
 */
export function captionsToVtt(segments: YouTubeCaptionSegment[]): string {
  let vtt = 'WEBVTT\n\n';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const startTime = formatVttTime(seg.start);
    const endTime = formatVttTime(seg.start + seg.duration);
    vtt += `${i + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${seg.text}\n\n`;
  }

  return vtt;
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Get YouTube embed URL for a video
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
