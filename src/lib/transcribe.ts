/**
 * Speech-to-text transcription using AssemblyAI
 * Used as fallback when YouTube captions are not available
 *
 * IMPORTANT: AssemblyAI needs a direct audio URL, NOT a YouTube page URL.
 * We extract the audio stream URL from YouTube's player response first.
 *
 * Free tier: 100 hours/month
 * Sign up: https://www.assemblyai.com/
 */

import { AssemblyAI } from 'assemblyai';

export interface TranscriptSegment {
  start: number;  // seconds
  duration: number; // seconds
  text: string;
}

/**
 * Extract direct audio stream URL from YouTube video
 * Parses the player response to get googlevideo.com audio URL
 */
async function extractYouTubeAudioUrl(videoId: string): Promise<string | null> {
  console.log(`[Transcribe] Extracting audio URL for ${videoId}...`);

  // Method 1: Use InnerTube Android API (often gives direct URLs without DASH)
  try {
    const androidRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            androidSdkVersion: 30,
            hl: 'en',
            gl: 'US',
          },
        },
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    });

    if (androidRes.ok) {
      const data = await androidRes.json();
      const formats = data?.streamingData?.adaptiveFormats || [];

      // Find audio-only format (prefer m4a/mp4a for compatibility)
      const audioFormats = formats
        .filter((f: any) => f.mimeType?.startsWith('audio/') && f.url)
        .sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0)); // lowest bitrate first (smaller file)

      if (audioFormats.length > 0) {
        console.log(`[Transcribe] Found ${audioFormats.length} audio formats via Android API`);
        return audioFormats[0].url;
      }

      // Check for cipher/signatureCipher formats
      const cipherFormats = formats.filter((f: any) => f.mimeType?.startsWith('audio/') && f.signatureCipher);
      if (cipherFormats.length > 0) {
        console.log(`[Transcribe] Audio formats found but they require signature decryption (cipher protected)`);
      }
    }
  } catch (error) {
    console.error(`[Transcribe] Android API failed:`, error instanceof Error ? error.message : error);
  }

  // Method 2: Use InnerTube iOS API (sometimes gives different URLs)
  try {
    const iosRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'IOS',
            clientVersion: '19.09.3',
            deviceModel: 'iPhone14,3',
            hl: 'en',
            gl: 'US',
          },
        },
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    });

    if (iosRes.ok) {
      const data = await iosRes.json();
      const formats = data?.streamingData?.adaptiveFormats || [];
      const audioFormats = formats
        .filter((f: any) => f.mimeType?.startsWith('audio/') && f.url)
        .sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0));

      if (audioFormats.length > 0) {
        console.log(`[Transcribe] Found ${audioFormats.length} audio formats via iOS API`);
        return audioFormats[0].url;
      }
    }
  } catch (error) {
    console.error(`[Transcribe] iOS API failed:`, error instanceof Error ? error.message : error);
  }

  // Method 3: Scrape watch page for player response
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2NDcwMTcxMjQaAmVuIAEaBgiA_NW2Bg',
      },
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const playerMatch = html.match(new RegExp('var\\s+ytInitialPlayerResponse\\s*=\\s*({.*?});\\s*(?:var|<\\/script>)', 's'));
      if (playerMatch) {
        const data = JSON.parse(playerMatch[1]);
        const formats = data?.streamingData?.adaptiveFormats || [];
        const audioFormats = formats
          .filter((f: any) => f.mimeType?.startsWith('audio/') && f.url)
          .sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0));

        if (audioFormats.length > 0) {
          console.log(`[Transcribe] Found ${audioFormats.length} audio formats via page scrape`);
          return audioFormats[0].url;
        }
      }
    }
  } catch (error) {
    console.error(`[Transcribe] Page scrape failed:`, error instanceof Error ? error.message : error);
  }

  console.error(`[Transcribe] Could not extract audio URL for ${videoId}`);
  return null;
}

/**
 * Transcribe a YouTube video using AssemblyAI
 * Extracts direct audio URL first, then sends to AssemblyAI
 */
export async function transcribeYouTubeVideo(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.log('[Transcribe] ASSEMBLYAI_API_KEY not set, skipping transcription');
    return [];
  }

  console.log(`[Transcribe] Starting transcription for YouTube video ${videoId}...`);

  // Extract direct audio URL from YouTube
  const audioUrl = await extractYouTubeAudioUrl(videoId);
  if (!audioUrl) {
    console.error(`[Transcribe] No audio URL found for ${videoId}, cannot transcribe`);
    return [];
  }

  console.log(`[Transcribe] Got audio URL (${audioUrl.substring(0, 80)}...), sending to AssemblyAI...`);

  const client = new AssemblyAI({ apiKey });

  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: audioUrl,
      language_detection: true,
    });

    if (transcript.status === 'error') {
      console.error(`[Transcribe] AssemblyAI error for ${videoId}:`, transcript.error);
      return [];
    }

    if (!transcript.words || transcript.words.length === 0) {
      console.log(`[Transcribe] No words found for ${videoId}`);
      return [];
    }

    return groupWordsIntoSegments(transcript.words);

  } catch (error) {
    console.error(`[Transcribe] AssemblyAI failed for ${videoId}:`, error);
    return [];
  }
}

/**
 * Group words into sentence-like segments for subtitle display
 */
function groupWordsIntoSegments(words: Array<{ start: number; end: number; text: string }>): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  let currentWords: typeof words = [];
  let segmentStart = words[0].start;

  for (const word of words) {
    currentWords.push(word);

    const endsWithPunctuation = /[.!?،؛]$/.test(word.text);
    const isLongEnough = currentWords.length >= 10;

    if (endsWithPunctuation || isLongEnough) {
      segments.push({
        start: segmentStart / 1000,
        duration: (word.end - segmentStart) / 1000,
        text: currentWords.map(w => w.text).join(' '),
      });
      currentWords = [];
      segmentStart = word.end;
    }
  }

  // Add remaining words
  if (currentWords.length > 0) {
    const lastWord = currentWords[currentWords.length - 1];
    segments.push({
      start: segmentStart / 1000,
      duration: (lastWord.end - segmentStart) / 1000,
      text: currentWords.map(w => w.text).join(' '),
    });
  }

  console.log(`[Transcribe] Grouped into ${segments.length} segments`);
  return segments;
}

/**
 * Transcribe from a direct audio/video URL
 */
export async function transcribeFromUrl(url: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.log('[Transcribe] ASSEMBLYAI_API_KEY not set');
    return [];
  }

  const client = new AssemblyAI({ apiKey });

  console.log(`[Transcribe] Starting transcription for URL: ${url}`);

  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: url,
      language_detection: true,
    });

    if (transcript.status === 'error') {
      console.error(`[Transcribe] Error:`, transcript.error);
      return [];
    }

    if (!transcript.words || transcript.words.length === 0) return [];

    const segments: TranscriptSegment[] = [];
    let currentWords: typeof transcript.words = [];
    let segmentStart = transcript.words[0].start;

    for (const word of transcript.words) {
      currentWords.push(word);
      const endsWithPunctuation = /[.!?،؛]$/.test(word.text);
      const isLongEnough = currentWords.length >= 10;

      if (endsWithPunctuation || isLongEnough) {
        segments.push({
          start: segmentStart / 1000,
          duration: (word.end - segmentStart) / 1000,
          text: currentWords.map(w => w.text).join(' '),
        });
        currentWords = [];
        segmentStart = word.end;
      }
    }

    if (currentWords.length > 0) {
      const lastWord = currentWords[currentWords.length - 1];
      segments.push({
        start: segmentStart / 1000,
        duration: (lastWord.end - segmentStart) / 1000,
        text: currentWords.map(w => w.text).join(' '),
      });
    }

    console.log(`[Transcribe] Got ${segments.length} segments from URL`);
    return segments;
  } catch (error) {
    console.error('[Transcribe] Failed:', error);
    return [];
  }
}
