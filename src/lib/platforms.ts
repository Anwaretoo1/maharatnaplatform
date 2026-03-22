/**
 * Multi-platform video detection and metadata extraction
 * Supports: YouTube, Vimeo, Coursera, Udemy, Khan Academy, direct video URLs
 */

export type Platform = 'youtube' | 'vimeo' | 'coursera' | 'udemy' | 'khan' | 'direct' | 'unknown';

export interface PlatformVideo {
  platform: Platform;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  embedUrl: string;
  originalUrl: string;
  position: number;
}

/**
 * Detect which platform a URL belongs to
 */
export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.includes('coursera.org')) return 'coursera';
  if (u.includes('udemy.com')) return 'udemy';
  if (u.includes('khanacademy.org')) return 'khan';
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u)) return 'direct';
  return 'unknown';
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Vimeo video details using oEmbed API (no API key needed)
 */
export async function fetchVimeoVideo(url: string): Promise<PlatformVideo | null> {
  const videoId = extractVimeoId(url);
  if (!videoId) return null;

  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;

    const data = await res.json();
    return {
      platform: 'vimeo',
      videoId,
      title: data.title || 'Vimeo Video',
      description: data.description || '',
      thumbnailUrl: data.thumbnail_url || '',
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      originalUrl: url,
      position: 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch metadata from any URL using oEmbed (works for many platforms)
 */
export async function fetchOEmbedData(url: string): Promise<{ title: string; description: string; thumbnailUrl: string; embedHtml: string } | null> {
  // Try common oEmbed providers
  const oembedUrls = [
    `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
  ];

  for (const oembedUrl of oembedUrls) {
    try {
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          return {
            title: data.title || '',
            description: data.description || data.author_name || '',
            thumbnailUrl: data.thumbnail_url || '',
            embedHtml: data.html || '',
          };
        }
      }
    } catch {
      // Try next
    }
  }
  return null;
}

/**
 * Extract embed URL from oEmbed HTML
 */
export function extractEmbedUrl(html: string): string | null {
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * Fetch page metadata (title, description, og:image) from any URL
 */
export async function fetchPageMetadata(url: string): Promise<{ title: string; description: string; thumbnailUrl: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Extract Open Graph metadata
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/) ||
                    html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/);
    const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/) ||
                   html.match(/<meta\s+content="([^"]*)"\s+property="og:description"/);
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/) ||
                    html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/);
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/);

    return {
      title: ogTitle?.[1] || titleTag?.[1] || '',
      description: ogDesc?.[1] || '',
      thumbnailUrl: ogImage?.[1] || '',
    };
  } catch {
    return null;
  }
}

/**
 * Build embed URL for known platforms
 */
export function buildEmbedUrl(platform: Platform, url: string, videoId?: string): string {
  switch (platform) {
    case 'vimeo':
      return `https://player.vimeo.com/video/${videoId || extractVimeoId(url)}`;
    case 'coursera':
    case 'udemy':
    case 'khan':
      // These platforms don't allow embedding, use original URL
      return url;
    case 'direct':
      return url;
    default:
      return url;
  }
}

/**
 * Process a list of URLs (one per line) and extract video info
 */
export async function processVideoUrls(urls: string[]): Promise<PlatformVideo[]> {
  const videos: PlatformVideo[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!url) continue;

    const platform = detectPlatform(url);

    if (platform === 'vimeo') {
      const video = await fetchVimeoVideo(url);
      if (video) {
        video.position = i;
        videos.push(video);
        continue;
      }
    }

    // Try oEmbed for any platform
    const oembed = await fetchOEmbedData(url);
    if (oembed) {
      const embedUrl = extractEmbedUrl(oembed.embedHtml) || url;
      videos.push({
        platform,
        videoId: `${platform}-${i}`,
        title: oembed.title,
        description: oembed.description,
        thumbnailUrl: oembed.thumbnailUrl,
        embedUrl,
        originalUrl: url,
        position: i,
      });
      continue;
    }

    // Fallback: fetch page metadata
    const meta = await fetchPageMetadata(url);
    videos.push({
      platform,
      videoId: `${platform}-${i}`,
      title: meta?.title || `فيديو ${i + 1}`,
      description: meta?.description || '',
      thumbnailUrl: meta?.thumbnailUrl || '',
      embedUrl: platform === 'direct' ? url : url,
      originalUrl: url,
      position: i,
    });
  }

  return videos;
}
