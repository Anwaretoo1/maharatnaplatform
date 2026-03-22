/**
 * Speech-to-text transcription using AssemblyAI
 * Used as fallback when YouTube captions are not available
 * AssemblyAI can transcribe directly from YouTube URLs (no audio download needed)
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
 * Transcribe a YouTube video using AssemblyAI
 * AssemblyAI handles audio extraction from YouTube internally
 */
export async function transcribeYouTubeVideo(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.log('[Transcribe] ASSEMBLYAI_API_KEY not set, skipping transcription');
    return [];
  }

  const client = new AssemblyAI({ apiKey });

  console.log(`[Transcribe] Starting AssemblyAI transcription for YouTube video ${videoId}...`);

  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: `https://www.youtube.com/watch?v=${videoId}`,
      language_detection: true, // Auto-detect language
    });

    if (transcript.status === 'error') {
      console.error(`[Transcribe] AssemblyAI error for ${videoId}:`, transcript.error);
      return [];
    }

    if (!transcript.words || transcript.words.length === 0) {
      console.log(`[Transcribe] No words found for ${videoId}`);
      return [];
    }

    // Group words into sentence-like segments (every ~10 words or at punctuation)
    const segments: TranscriptSegment[] = [];
    let currentWords: typeof transcript.words = [];
    let segmentStart = transcript.words[0].start;

    for (const word of transcript.words) {
      currentWords.push(word);

      const text = currentWords.map(w => w.text).join(' ');
      const endsWithPunctuation = /[.!?،؛]$/.test(word.text);
      const isLongEnough = currentWords.length >= 10;

      if (endsWithPunctuation || isLongEnough) {
        segments.push({
          start: segmentStart / 1000,
          duration: (word.end - segmentStart) / 1000,
          text,
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

    console.log(`[Transcribe] Got ${segments.length} segments from AssemblyAI for ${videoId}`);
    return segments;

  } catch (error) {
    console.error(`[Transcribe] AssemblyAI failed for ${videoId}:`, error);
    return [];
  }
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
