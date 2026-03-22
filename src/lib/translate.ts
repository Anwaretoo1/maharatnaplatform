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
    // Extract JSON from response (handle possible markdown wrapping)
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
    // Fallback if parsing fails
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
 * Translate caption segments to Arabic in batches
 * Processes captions in chunks to stay within token limits
 */
export async function translateCaptions(
  segments: { start: number; duration: number; text: string }[]
): Promise<TranslatedCaption[]> {
  if (segments.length === 0) return [];

  const client = getClient();
  const BATCH_SIZE = 50; // Translate 50 segments at a time
  const translatedSegments: TranslatedCaption[] = [];

  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    const batch = segments.slice(i, i + BATCH_SIZE);
    const numberedLines = batch.map((seg, idx) => `${idx + 1}|${seg.text}`).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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
      // Try to find the translated line by number
      const lineNum = j + 1;
      const translatedLine = lines.find(l => l.startsWith(`${lineNum}|`));
      const translatedText = translatedLine
        ? translatedLine.substring(translatedLine.indexOf('|') + 1).trim()
        : seg.text; // fallback to original

      translatedSegments.push({
        start: seg.start,
        duration: seg.duration,
        text: translatedText,
      });
    }
  }

  return translatedSegments;
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
