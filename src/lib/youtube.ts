/**
 * YouTube utilities - works WITHOUT API key using InnerTube
 */

import { YoutubeTranscript } from 'youtube-transcript';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  position: number;
}

export interface YouTubeCaptionSegment {
  start: number;
  duration: number;
  text: string;
}

/**
 * Extract playlist ID from URL
 */
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract video ID from URL
 */
export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * YouTube InnerTube API helper - fetches data like the YouTube app does
 */
async function innertubeRequest(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': '2.20240101.00.00',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240101.00.00',
          hl: 'en',
          gl: 'US',
        }
      },
      ...body,
    }),
  });
  return res.json();
}

/**
 * Fetch playlist videos using YouTube page scraping (no API key needed)
 */
export async function fetchPlaylistVideos(playlistId: string, _apiKey?: string): Promise<YouTubeVideo[]> {
  // First try with API key if provided
  if (_apiKey) {
    try {
      const videos = await fetchPlaylistWithApi(playlistId, _apiKey);
      if (videos.length > 0) return videos;
    } catch {
      // Fall through to scraping
    }
  }

  // Fallback: scrape playlist page
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'CONSENT=YES+',
    },
  });

  if (!res.ok) throw new Error('Failed to fetch playlist');

  const html = await res.text();
  const videos: YouTubeVideo[] = [];

  // Extract video data from initial data JSON
  const dataMatch = html.match(new RegExp('var\\s+ytInitialData\\s*=\\s*({.*?});\\s*<\\/script>', 's'));
  if (!dataMatch) {
    // Try alternate pattern
    const altMatch = html.match(new RegExp("ytInitialData\\s*=\\s*'({.*?})'", 's'));
    if (!altMatch) throw new Error('Could not parse playlist page');
  }

  try {
    const data = JSON.parse(dataMatch![1]);
    const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]
      ?.playlistVideoListRenderer?.contents;

    if (contents) {
      for (const item of contents) {
        const video = item.playlistVideoRenderer;
        if (video?.videoId) {
          videos.push({
            videoId: video.videoId,
            title: video.title?.runs?.[0]?.text || video.title?.simpleText || '',
            description: '',
            thumbnailUrl: video.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || '',
            position: parseInt(video.index?.simpleText || '0'),
          });
        }
      }
    }
  } catch {
    throw new Error('Could not parse playlist data');
  }

  return videos;
}

/**
 * Fetch playlist with YouTube Data API v3
 */
async function fetchPlaylistWithApi(playlistId: string, apiKey: string): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let nextPageToken = '';

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    for (const item of data.items || []) {
      const snippet = item.snippet;
      if (snippet.resourceId?.videoId) {
        videos.push({
          videoId: snippet.resourceId.videoId,
          title: snippet.title,
          description: snippet.description || '',
          thumbnailUrl: snippet.thumbnails?.high?.url || '',
          position: snippet.position,
        });
      }
    }
    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  return videos;
}

/**
 * Fetch single video details (no API key needed)
 */
export async function fetchVideoDetails(videoId: string, _apiKey?: string): Promise<YouTubeVideo | null> {
  // Try API first
  if (_apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${_apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          return {
            videoId: item.id,
            title: item.snippet.title,
            description: item.snippet.description || '',
            thumbnailUrl: item.snippet.thumbnails?.high?.url || '',
            position: 0,
          };
        }
      }
    } catch { /* fall through */ }
  }

  // Fallback: scrape watch page
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'CONSENT=YES+',
    },
  });

  if (!res.ok) return null;
  const html = await res.text();

  // Extract title
  const titleMatch = html.match(/"title":"(.*?)"/);
  const thumbMatch = html.match(/"thumbnails":\[{"url":"(.*?)"/);

  return {
    videoId,
    title: titleMatch ? JSON.parse(`"${titleMatch[1]}"`) : videoId,
    description: '',
    thumbnailUrl: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    position: 0,
  };
}

/**
 * Check if a YouTube video has captions available (without downloading)
 */
export async function checkYouTubeCaptions(videoId: string): Promise<{ available: boolean; languages: string[] }> {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'CONSENT=YES+',
      },
    });

    if (!pageRes.ok) return { available: false, languages: [] };
    const html = await pageRes.text();

    const playerMatch = html.match(new RegExp('var\\s+ytInitialPlayerResponse\\s*=\\s*({.*?});\\s*(?:var|<\\/script>)', 's'));
    if (!playerMatch) return { available: false, languages: [] };

    const playerData = JSON.parse(playerMatch[1]);
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) return { available: false, languages: [] };

    return {
      available: true,
      languages: captionTracks.map((t: any) => t.languageCode),
    };
  } catch {
    return { available: false, languages: [] };
  }
}

/**
 * Fetch YouTube captions using youtube-transcript package (InnerTube + web scraping)
 * with a third-party fallback via yt.lemnoslife.com
 */
export async function fetchYouTubeCaptions(videoId: string, lang: string = 'en'): Promise<YouTubeCaptionSegment[]> {
  console.log(`[Captions] Starting caption fetch for videoId=${videoId}, lang=${lang}`);

  // --- Attempt 1: youtube-transcript package ---
  try {
    console.log(`[Captions] Attempt 1: youtube-transcript package (lang=${lang})`);

    let transcript;
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      console.log(`[Captions] youtube-transcript succeeded with lang=${lang}, segments=${transcript?.length ?? 0}`);
    } catch (langErr) {
      console.warn(`[Captions] youtube-transcript failed for lang=${lang}, retrying without lang preference:`, langErr);
      transcript = await YoutubeTranscript.fetchTranscript(videoId);
      console.log(`[Captions] youtube-transcript succeeded without lang filter, segments=${transcript?.length ?? 0}`);
    }

    if (transcript && transcript.length > 0) {
      console.log(`[Captions] Returning ${transcript.length} segments from youtube-transcript for ${videoId}`);
      return transcript.map(seg => ({
        start: (seg.offset || 0) / 1000,
        duration: (seg.duration || 3000) / 1000,
        text: seg.text.replace(/\n/g, ' ').trim(),
      }));
    }

    console.log(`[Captions] youtube-transcript returned empty transcript for ${videoId}`);
  } catch (error) {
    console.error(`[Captions] youtube-transcript package failed entirely for ${videoId}:`, error instanceof Error ? error.message : error);
  }

  // --- Attempt 2: Third-party fallback (yt.lemnoslife.com) ---
  try {
    const fallbackUrl = `https://yt.lemnoslife.com/noKey/captions?videoId=${videoId}&lang=${lang}`;
    console.log(`[Captions] Attempt 2: third-party fallback GET ${fallbackUrl}`);

    const res = await fetch(fallbackUrl);
    console.log(`[Captions] Fallback response status=${res.status} for ${videoId}`);

    if (!res.ok) {
      console.error(`[Captions] Fallback returned HTTP ${res.status} for ${videoId}`);
      return [];
    }

    const contentType = res.headers.get('content-type') || '';
    const body = await res.text();
    console.log(`[Captions] Fallback content-type=${contentType}, body length=${body.length} for ${videoId}`);

    if (body.length === 0) {
      console.log(`[Captions] Fallback returned empty body for ${videoId}`);
      return [];
    }

    // Try parsing as JSON (the API may return JSON with caption data)
    let segments: YouTubeCaptionSegment[] = [];

    if (contentType.includes('application/json') || body.trimStart().startsWith('{') || body.trimStart().startsWith('[')) {
      try {
        const json = JSON.parse(body);
        console.log(`[Captions] Fallback parsed as JSON, keys=${Object.keys(json).join(',')} for ${videoId}`);

        // Handle various JSON response shapes
        const items = json.subtitles || json.captions || json.events || json.items || json;
        if (Array.isArray(items)) {
          segments = items
            .filter((item: any) => item.text || item.utf8)
            .map((item: any) => ({
              start: (item.start ?? item.tStartMs ?? item.offset ?? 0) / (item.start !== undefined ? 1 : 1000),
              duration: (item.duration ?? item.dDurationMs ?? item.dur ?? 3000) / (item.duration !== undefined ? 1 : 1000),
              text: (item.text || item.utf8 || '').replace(/\n/g, ' ').trim(),
            }));
        }
      } catch (jsonErr) {
        console.warn(`[Captions] Fallback JSON parse failed, trying XML:`, jsonErr);
      }
    }

    // Try parsing as XML (timedtext format)
    if (segments.length === 0 && body.includes('<text')) {
      console.log(`[Captions] Fallback parsing as timedtext XML for ${videoId}`);
      segments = parseTimedTextXml(body);
    }

    // Try parsing as SRV3 XML
    if (segments.length === 0 && body.includes('<p ')) {
      console.log(`[Captions] Fallback parsing as SRV3 XML for ${videoId}`);
      segments = parseSrv3Captions(body);
    }

    console.log(`[Captions] Fallback produced ${segments.length} segments for ${videoId}`);
    return segments;

  } catch (fallbackError) {
    console.error(`[Captions] Fallback also failed for ${videoId}:`, fallbackError instanceof Error ? fallbackError.message : fallbackError);
  }

  console.log(`[Captions] All caption sources exhausted for ${videoId}, returning empty`);
  return [];
}

/**
 * Parse SRT subtitle format to caption segments
 */
export function parseSrt(srtText: string): YouTubeCaptionSegment[] {
  const segments: YouTubeCaptionSegment[] = [];
  const blocks = srtText.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Find timestamp line
    let timeLineIdx = lines.findIndex(l => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    const text = lines.slice(timeLineIdx + 1).join(' ').trim();

    if (text) {
      const start = parseSrtTime(startStr);
      const end = parseSrtTime(endStr);
      segments.push({
        start,
        duration: end - start,
        text: cleanHtml(text),
      });
    }
  }

  return segments;
}

function parseSrtTime(timeStr: string): number {
  // Format: 00:01:23,456 or 00:01:23.456
  const parts = timeStr.replace(',', '.').split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return 0;
}

/**
 * Parse VTT subtitle format to caption segments
 */
export function parseVtt(vttText: string): YouTubeCaptionSegment[] {
  const segments: YouTubeCaptionSegment[] = [];
  const blocks = vttText.split('\n\n');

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timeLineIdx = lines.findIndex(l => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const [startStr, endStr] = lines[timeLineIdx].split('-->').map(s => s.trim());
    const text = lines.slice(timeLineIdx + 1).join(' ').trim();

    if (text) {
      const start = parseVttTime(startStr);
      const end = parseVttTime(endStr);
      segments.push({
        start,
        duration: end - start,
        text: cleanHtml(text),
      });
    }
  }

  return segments;
}

function parseVttTime(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

/**
 * Parse json3 caption format
 */
function parseJson3Captions(jsonStr: string): YouTubeCaptionSegment[] {
  const segments: YouTubeCaptionSegment[] = [];
  try {
    const data = JSON.parse(jsonStr);
    const events = data.events || [];

    for (const event of events) {
      if (!event.segs) continue;
      const text = event.segs.map((s: any) => s.utf8 || '').join('').trim();
      if (!text || text === '\n') continue;

      segments.push({
        start: (event.tStartMs || 0) / 1000,
        duration: (event.dDurationMs || 3000) / 1000,
        text: text.replace(/\n/g, ' '),
      });
    }
  } catch {
    // Parse error
  }
  return segments;
}

/**
 * Parse srv3 caption XML format
 */
function parseSrv3Captions(xml: string): YouTubeCaptionSegment[] {
  const segments: YouTubeCaptionSegment[] = [];
  const regex = new RegExp('<p\\s+t="(\\d+)"\\s+d="(\\d+)"[^>]*>(.*?)</p>', 'gs');
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const text = cleanHtml(match[3]);
    if (text) {
      segments.push({
        start: parseInt(match[1]) / 1000,
        duration: parseInt(match[2]) / 1000,
        text,
      });
    }
  }
  return segments;
}

/**
 * Parse timedtext XML format (default format)
 */
function parseTimedTextXml(xml: string): YouTubeCaptionSegment[] {
  const segments: YouTubeCaptionSegment[] = [];
  const regex = new RegExp('<text\\s+start="([\\d.]+)"\\s+dur="([\\d.]+)"[^>]*>(.*?)</text>', 'gs');
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const text = cleanHtml(match[3]);
    if (text) {
      segments.push({
        start: parseFloat(match[1]),
        duration: parseFloat(match[2]),
        text,
      });
    }
  }
  return segments;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Convert caption segments to WebVTT format
 */
export function captionsToVtt(segments: YouTubeCaptionSegment[]): string {
  let vtt = 'WEBVTT\n\n';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    vtt += `${i + 1}\n`;
    vtt += `${formatVttTime(seg.start)} --> ${formatVttTime(seg.start + seg.duration)}\n`;
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
 * Get YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
