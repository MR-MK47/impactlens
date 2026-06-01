// ═══════════════════════════════════════════════════════════
// Gemini AI Client — Image Analysis & Blog Generation
// Uses Gemini 2.5 Flash Lite via the REST API
// ═══════════════════════════════════════════════════════════

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

/**
 * Analyze a field photo and generate an empathetic, contextual description.
 */
export async function analyzeFieldPhoto(
  imageBase64: string,
  mimeType: string,
  category: string,
  orgType: string = 'ngo'
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'AI description unavailable — please configure your Gemini API key.';
  }

  const persona = orgType === 'ngo'
    ? 'You are a compassionate impact reporter for a non-profit organization.'
    : 'You are a professional field reporter.';

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `${persona}

Analyze this field photo from the "${category}" category and write a 2-3 sentence description that:
- Describes what is happening in the photo
- Highlights the human impact
- Is warm, factual, and donor-appropriate
- Does NOT fabricate details — only describe what is visibly present

Write ONLY the description, no titles or labels.`,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    }),
  });

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate description.';
}

/**
 * Generate an SEO blog post from approved media submissions.
 */
export async function generateBlogPost(
  mediaDescriptions: Array<{ description: string; category: string; date: string }>,
  orgName: string,
  orgType: string = 'ngo'
): Promise<{
  title: string;
  body: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string[];
  slug: string;
}> {
  if (!GEMINI_API_KEY) {
    return {
      title: 'Draft Blog Post',
      body: 'AI blog generation unavailable — please configure your Gemini API key.',
      excerpt: '',
      metaTitle: '',
      metaDescription: '',
      focusKeywords: [],
      slug: 'draft-post',
    };
  }

  const summaries = mediaDescriptions
    .map((m, i) => `${i + 1}. [${m.category}] (${m.date}): ${m.description}`)
    .join('\n');

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are an SEO content writer for ${orgName}, a ${orgType} organization.

Based on these field impact reports from this week:

${summaries}

Generate a complete SEO blog post in the following JSON format:
{
  "title": "SEO-optimized title (50-60 chars)",
  "body": "600-800 word article in HTML format with proper <h2>, <p>, <strong> tags",
  "excerpt": "2-sentence summary for blog listing",
  "metaTitle": "Meta title for Google (max 60 chars)",
  "metaDescription": "Meta description (max 160 chars)",
  "focusKeywords": ["keyword1", "keyword2", "keyword3"],
  "slug": "url-friendly-slug"
}

The article should:
- Use geo-specific keywords naturally
- Weave the field reports into a compelling narrative
- Include a call-to-action for donors
- Sound human and warm, not robotic

Respond with ONLY valid JSON, no markdown code blocks.`,
        }],
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000,
      },
    }),
  });

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: 'Draft Blog Post',
      body: text,
      excerpt: '',
      metaTitle: '',
      metaDescription: '',
      focusKeywords: [],
      slug: `draft-${Date.now()}`,
    };
  }
}

/**
 * Convert a File object to base64.
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
