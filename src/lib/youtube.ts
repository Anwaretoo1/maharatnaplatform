/**
 * YouTube utilities - works WITHOUT API key using InnerTube
 */

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
 * Fetch YouTube captions by scraping the video page and following caption track URLs
 * Uses cookies from the initial page fetch to authenticate caption requests
 */
export async function fetchYouTubeCaptions(videoId: string, lang: string = 'en'): Promise<YouTubeCaptionSegment[]> {
  try {
    // Step 1: Fetch the watch page and capture cookies
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2MTQ3MzEyMjAaAmVuIAEaBgiA_LyaBg',
      },
      redirect: 'follow',
    });

    if (!pageRes.ok) {
      console.log(`[Captions] Failed to fetch video page for ${videoId}: ${pageRes.status}`);
      return [];
    }

    // Capture response cookies for authenticated caption requests
    const responseCookies = pageRes.headers.get('set-cookie') || '';
    const html = await pageRes.text();

    // Step 2: Extract ytInitialPlayerResponse to find caption tracks
    const playerMatch = html.match(new RegExp('var\\s+ytInitialPlayerResponse\\s*=\\s*({.*?});\\s*(?:var|<\\/script>)', 's'));
    if (!playerMatch) {
      console.log(`[Captions] Could not find player response for ${videoId}`);
      return [];
    }

    const playerData = JSON.parse(playerMatch[1]);
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      console.log(`[Captions] No caption tracks found for ${videoId}`);
      return [];
    }

    // Step 3: Find the best caption track (prefer manual, then ASR)
    let track = captionTracks.find((t: any) => t.languageCode === lang && t.kind !== 'asr');
    if (!track) track = captionTracks.find((t: any) => t.languageCode === lang);
    if (!track) track = captionTracks.find((t: any) => t.languageCode.startsWith('en'));
    if (!track) track = captionTracks[0]; // fallback to first available

    if (!track?.baseUrl) {
      console.log(`[Captions] No suitable caption track URL for ${videoId}`);
      return [];
    }

    console.log(`[Captions] Found caption track for ${videoId}: ${track.languageCode} (${track.kind || 'manual'})`);

    // Step 4: Fetch the caption XML using the signed URL with same session cookies
    const captionUrl = track.baseUrl + '&fmt=srv3';
    const captionRes = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': `https://www.youtube.com/watch?v=${videoId}`,
        'Cookie': responseCookies ? responseCookies : 'CONSENT=PENDING+987',
      },
    });

    if (!captionRes.ok) {
      // Try json3 format as fallback
      const json3Url = track.baseUrl + '&fmt=json3';
      const json3Res = await fetch(json3Url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': `https://www.youtube.com/watch?v=${videoId}`,
          'Cookie': responseCookies ? responseCookies : 'CONSENT=PENDING+987',
        },
      });

      if (json3Res.ok) {
        const json3Text = await json3Res.text();
        const segments = parseJson3Captions(json3Text);
        if (segments.length > 0) {
          console.log(`[Captions] Got ${segments.length} segments via json3 for ${videoId}`);
          return segments;
        }
      }

      console.log(`[Captions] Caption fetch failed for ${videoId}: ${captionRes.status}`);
      return [];
    }

    const captionXml = await captionRes.text();

    // Step 5: Parse the caption XML
    let segments = parseSrv3Captions(captionXml);
    if (segments.length === 0) {
      segments = parseTimedTextXml(captionXml);
    }

    console.log(`[Captions] Got ${segments.length} caption segments for ${videoId}`);
    return segments;

  } catch (error) {
    console.error(`[Captions] Error fetching captions for ${videoId}:`, error);
    return [];
  }
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
