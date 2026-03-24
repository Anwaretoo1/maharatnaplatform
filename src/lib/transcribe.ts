/**
 * Speech-to-text transcription using AssemblyAI
 *
 * Flow: Extract audio URL from YouTube → Download audio on OUR server →
 *       Upload buffer to AssemblyAI → Get transcription
 *
 * This bypasses YouTube's IP restrictions because we download from the
 * same IP that requested the audio URL.
 */

import { AssemblyAI } from 'assemblyai';

export interface TranscriptSegment {
  start: number;  // seconds
  duration: number; // seconds
  text: string;
}

/**
 * Extract direct audio stream URL from YouTube video using InnerTube API
 */
async function extractYouTubeAudioUrl(videoId: string): Promise<string | null> {
  console.log(`[Transcribe] Extracting audio URL for ${videoId}...`);

  // Try multiple InnerTube client types
  const clients = [
    {
      name: 'ANDROID',
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.09.37',
          androidSdkVersion: 30,
          hl: 'en',
          gl: 'US',
        },
      },
    },
    {
      name: 'IOS',
      context: {
        client: {
          clientName: 'IOS',
          clientVersion: '19.09.3',
          deviceModel: 'iPhone14,3',
          hl: 'en',
          gl: 'US',
        },
      },
    },
    {
      name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
      context: {
        client: {
          clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
          clientVersion: '2.0',
          hl: 'en',
          gl: 'US',
        },
        thirdParty: {
          embedUrl: 'https://www.google.com',
        },
      },
    },
  ];

  for (const clientConfig of clients) {
    try {
      console.log(`[Transcribe] Trying ${clientConfig.name} client...`);
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': clientConfig.name === 'ANDROID'
            ? 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip'
            : clientConfig.name === 'IOS'
              ? 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)'
              : 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          context: clientConfig.context,
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });

      if (!res.ok) {
        console.log(`[Transcribe] ${clientConfig.name} returned HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const playability = data?.playabilityStatus?.status;
      console.log(`[Transcribe] ${clientConfig.name} playability: ${playability}`);

      if (playability !== 'OK') continue;

      const formats = [
        ...(data?.streamingData?.adaptiveFormats || []),
        ...(data?.streamingData?.formats || []),
      ];

      // Find audio-only formats with direct URLs (no cipher)
      const audioFormats = formats
        .filter((f: any) => f.mimeType?.startsWith('audio/') && f.url)
        .sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0));

      if (audioFormats.length > 0) {
        const chosen = audioFormats[0];
        console.log(`[Transcribe] ✓ Found audio via ${clientConfig.name}: ${chosen.mimeType}, ${chosen.bitrate}bps, ~${Math.round((chosen.contentLength || 0) / 1024 / 1024)}MB`);
        return chosen.url;
      }

      // Check if formats exist but are cipher-protected
      const cipherFormats = formats.filter((f: any) => f.mimeType?.startsWith('audio/') && (f.signatureCipher || f.cipher));
      if (cipherFormats.length > 0) {
        console.log(`[Transcribe] ${clientConfig.name} has ${cipherFormats.length} cipher-protected audio formats (can't use)`);
      }
    } catch (error) {
      console.error(`[Transcribe] ${clientConfig.name} failed:`, error instanceof Error ? error.message : error);
    }
  }

  console.error(`[Transcribe] ✗ Could not extract audio URL for ${videoId} from any client`);
  return null;
}

/**
 * Download audio from URL as Buffer (runs on our server = same IP)
 */
async function downloadAudio(url: string, maxSizeMB: number = 50): Promise<Buffer | null> {
  console.log(`[Transcribe] Downloading audio...`);
  const maxBytes = maxSizeMB * 1024 * 1024;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
        'Range': `bytes=0-${maxBytes - 1}`,
      },
    });

    if (!res.ok && res.status !== 206) {
      console.error(`[Transcribe] Audio download HTTP ${res.status}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[Transcribe] ✓ Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB audio`);
    return buffer;
  } catch (error) {
    console.error(`[Transcribe] Audio download failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Transcribe a YouTube video using AssemblyAI
 *
 * Flow: InnerTube → download audio on our server → upload to AssemblyAI → transcribe
 */
export async function transcribeYouTubeVideo(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.log('[Transcribe] ASSEMBLYAI_API_KEY not set, skipping');
    return [];
  }

  console.log(`[Transcribe] === Starting transcription for ${videoId} ===`);

  // Step 1: Get direct audio URL from YouTube
  const audioUrl = await extractYouTubeAudioUrl(videoId);
  if (!audioUrl) {
    console.error(`[Transcribe] ✗ No audio URL for ${videoId}`);
    return [];
  }

  // Step 2: Download audio on our server (same IP = bypasses restriction)
  const audioBuffer = await downloadAudio(audioUrl);
  if (!audioBuffer || audioBuffer.length < 1000) {
    console.error(`[Transcribe] ✗ Audio download failed or too small for ${videoId}`);
    return [];
  }

  // Step 3: Upload to AssemblyAI
  const client = new AssemblyAI({ apiKey });
  let uploadUrl: string;

  try {
    console.log(`[Transcribe] Uploading ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB to AssemblyAI...`);
    uploadUrl = await client.files.upload(audioBuffer);
    console.log(`[Transcribe] ✓ Uploaded to AssemblyAI: ${uploadUrl.substring(0, 60)}...`);
  } catch (error) {
    console.error(`[Transcribe] ✗ Upload to AssemblyAI failed:`, error instanceof Error ? error.message : error);
    return [];
  }

  // Step 4: Transcribe
  try {
    console.log(`[Transcribe] Starting transcription...`);
    const transcript = await client.transcripts.transcribe({
      audio_url: uploadUrl,
      language_detection: true,
    });

    if (transcript.status === 'error') {
      console.error(`[Transcribe] ✗ AssemblyAI error: ${transcript.error}`);
      return [];
    }

    if (!transcript.words || transcript.words.length === 0) {
      console.log(`[Transcribe] ✗ No words detected for ${videoId}`);
      return [];
    }

    console.log(`[Transcribe] ✓ Got ${transcript.words.length} words, language: ${transcript.language_code}`);
    return groupWordsIntoSegments(transcript.words);

  } catch (error) {
    console.error(`[Transcribe] ✗ Transcription failed:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Group words into subtitle-sized segments (~10 words or at punctuation)
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

  if (currentWords.length > 0) {
    const lastWord = currentWords[currentWords.length - 1];
    segments.push({
      start: segmentStart / 1000,
      duration: (lastWord.end - segmentStart) / 1000,
      text: currentWords.map(w => w.text).join(' '),
    });
  }

  console.log(`[Transcribe] ✓ Created ${segments.length} subtitle segments`);
  return segments;
}

/**
 * Transcribe from a direct audio/video URL (non-YouTube)
 */
export async function transcribeFromUrl(url: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) return [];

  const client = new AssemblyAI({ apiKey });
  console.log(`[Transcribe] Transcribing URL: ${url}`);

  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: url,
      language_detection: true,
    });

    if (transcript.status === 'error' || !transcript.words?.length) return [];
    return groupWordsIntoSegments(transcript.words);
  } catch (error) {
    console.error('[Transcribe] Failed:', error);
    return [];
  }
}
