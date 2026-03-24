/**
 * Translation utilities using Claude API (Anthropic SDK)
 */
import Anthropic from '@anthropic-ai/sdk';

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
};

export interface TranslatedCourseMetadata {
  title: string;
  description: string;
  category: string;
  seoKeywords: string[];
}

export interface TranslatedCaption {
  start: number;
  duration: number;
  text: string; // Arabic translated text
}

/**
 * Translate course metadata (title, description) to Arabic with SEO optimization
 */
export async function translateCourseMetadata(
  originalTitle: string,
  originalDescription: string,
  suggestedCategory?: string
): Promise<TranslatedCourseMetadata> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `أنت مترجم محترف ومتخصص في SEO العربي. ترجم معلومات الدورة التالية إلى العربية بشكل جذاب ومحسّن لمحركات البحث.

عنوان الدورة الأصلي: ${originalTitle}
وصف الدورة الأصلي: ${originalDescription}

أجب بصيغة JSON فقط (بدون أي نص إضافي) بالشكل التالي:
{
  "title": "العنوان بالعربية - جذاب ومحسّن SEO",
  "description": "وصف شامل بالعربية (3-5 جمل) يتضمن كلمات مفتاحية طبيعية",
  "category": "التصنيف المناسب بالعربية (مثال: برمجة، تصميم، تسويق، أعمال، لغات، علوم)",
  "seoKeywords": ["كلمة1", "كلمة2", "كلمة3", "كلمة4", "كلمة5"]
}`
      }
    ]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || originalTitle,
      description: parsed.description || originalDescription,
      category: parsed.category || suggestedCategory || 'عام',
      seoKeywords: parsed.seoKeywords || [],
    };
  } catch {
    return {
      title: originalTitle,
      description: originalDescription,
      category: suggestedCategory || 'عام',
      seoKeywords: [],
    };
  }
}

/**
 * Translate video title to Arabic
 */
export async function translateVideoTitle(originalTitle: string): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `ترجم عنوان الفيديو التالي إلى العربية بشكل واضح ومفهوم. أعد العنوان المترجم فقط بدون أي شرح:

${originalTitle}`
      }
    ]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return text.trim() || originalTitle;
}

/**
 * Split long caption segments into subtitle-sized chunks (~8 seconds max)
 * This ensures subtitles display properly and translation batches are manageable
 */
function normalizeSegments(
  segments: { start: number; duration: number; text: string }[]
): { start: number; duration: number; text: string }[] {
  const MAX_DURATION = 10; // seconds per subtitle
  const MAX_CHARS = 200;   // max chars per subtitle line
  const result: { start: number; duration: number; text: string }[] = [];

  for (const seg of segments) {
    // If segment is short enough, keep as-is
    if (seg.duration <= MAX_DURATION && seg.text.length <= MAX_CHARS) {
      result.push(seg);
      continue;
    }

    // Split long segments by sentences
    const sentences = seg.text.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 1 && seg.text.length <= MAX_CHARS) {
      result.push(seg);
      continue;
    }

    // Distribute time across sentences proportionally by character count
    const totalChars = seg.text.length;
    let currentStart = seg.start;

    let chunk = '';
    let chunkStart = currentStart;

    for (const sentence of sentences) {
      if (chunk && (chunk.length + sentence.length > MAX_CHARS)) {
        // Flush current chunk
        const chunkDuration = (chunk.length / totalChars) * seg.duration;
        result.push({ start: chunkStart, duration: chunkDuration, text: chunk.trim() });
        currentStart = chunkStart + chunkDuration;
        chunkStart = currentStart;
        chunk = sentence;
      } else {
        chunk = chunk ? chunk + ' ' + sentence : sentence;
      }
    }

    // Flush remaining
    if (chunk) {
      const remaining = seg.start + seg.duration - chunkStart;
      result.push({ start: chunkStart, duration: Math.max(remaining, 1), text: chunk.trim() });
    }
  }

  return result;
}

/**
 * Translate caption segments to Arabic in batches with concurrency
 * - Normalizes long segments first
 * - Uses larger batches (150 segments)
 * - Processes 3 batches in parallel
 */
export async function translateCaptions(
  segments: { start: number; duration: number; text: string }[]
): Promise<TranslatedCaption[]> {
  if (segments.length === 0) return [];

  // Step 1: Normalize segments (split long ones)
  const normalized = normalizeSegments(segments);
  console.log(`[Translate] Normalized ${segments.length} → ${normalized.length} segments`);

  const client = getClient();
  const BATCH_SIZE = 150;     // Larger batches = fewer API calls
  const CONCURRENCY = 3;      // Process 3 batches at a time
  const translatedSegments: (TranslatedCaption | null)[] = new Array(normalized.length).fill(null);

  // Create all batches
  const batches: { startIdx: number; batch: typeof normalized }[] = [];
  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    batches.push({ startIdx: i, batch: normalized.slice(i, i + BATCH_SIZE) });
  }

  console.log(`[Translate] ${batches.length} batches to translate (${CONCURRENCY} concurrent)`);

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    console.log(`[Translate] Processing batch group ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(batches.length / CONCURRENCY)}...`);

    const promises = chunk.map(async ({ startIdx, batch }) => {
      const numberedLines = batch.map((seg, idx) => `${idx + 1}|${seg.text}`).join('\n');

      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          messages: [
            {
              role: 'user',
              content: `ترجم الترجمات التالية (subtitles) إلى العربية. كل سطر يبدأ برقم ثم | ثم النص.
أعد كل سطر بنفس الصيغة: الرقم|النص المترجم
لا تضف أي شرح أو نص إضافي. حافظ على نفس الأرقام.

${numberedLines}`
            }
          ]
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const lines = text.trim().split('\n');

        for (let j = 0; j < batch.length; j++) {
          const seg = batch[j];
          const lineNum = j + 1;
          const translatedLine = lines.find(l => l.startsWith(`${lineNum}|`));
          const translatedText = translatedLine
            ? translatedLine.substring(translatedLine.indexOf('|') + 1).trim()
            : seg.text;

          translatedSegments[startIdx + j] = {
            start: seg.start,
            duration: seg.duration,
            text: translatedText,
          };
        }
      } catch (error) {
        console.error(`[Translate] Batch at ${startIdx} failed:`, error instanceof Error ? error.message : error);
        // Fill with original text on failure
        for (let j = 0; j < batch.length; j++) {
          translatedSegments[startIdx + j] = {
            start: batch[j].start,
            duration: batch[j].duration,
            text: batch[j].text,
          };
        }
      }
    });

    await Promise.all(promises);
  }

  // Filter out nulls (shouldn't happen but safety)
  const result = translatedSegments.filter((s): s is TranslatedCaption => s !== null);
  console.log(`[Translate] ✓ Translated ${result.length} segments`);
  return result;
}

/**
 * Convert translated captions to WebVTT format
 */
export function translatedCaptionsToVtt(segments: TranslatedCaption[]): string {
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
