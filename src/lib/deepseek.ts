import OpenAI from 'openai';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const MODEL = 'deepseek-chat';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  tr: 'Turkish',
  vi: 'Vietnamese'
};

function detectLanguage(text: string): string {
  const chineseChars = /[\u4e00-\u9fff]/;
  const arabicChars = /[\u0600-\u06ff]/;
  const japaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanChars = /[\uac00-\ud7af]/;
  const russianChars = /[\u0400-\u04ff]/;

  if (chineseChars.test(text)) return 'zh';
  if (arabicChars.test(text)) return 'ar';
  if (japaneseChars.test(text)) return 'ja';
  if (koreanChars.test(text)) return 'ko';
  if (russianChars.test(text)) return 'ru';
  if (/[a-zA-Z]{5,}/.test(text)) return 'en';
  return 'unknown';
}

function filterTextByLanguage(text: string, targetLang: string): string {
  const lines = text.split('\n');
  const filtered: string[] = [];
  
  const mainLang = detectLanguage(text);
  const keepLangs = [mainLang, 'en', targetLang];

  for (const line of lines) {
    if (!line.trim() || line.length < 20) {
      filtered.push(line);
      continue;
    }

    const lineLang = detectLanguage(line);
    if (keepLangs.includes(lineLang) || lineLang === 'unknown') {
      filtered.push(line);
    }
  }

  return filtered.join('\n');
}

function preprocessText(text: string): string {
  return text
    .replace(/\[!IMPORTANT\]/gi, '**⚠️ IMPORTANT:**')
    .replace(/\[!NOTE\]/gi, '**📝 NOTE:**')
    .replace(/\[!WARNING\]/gi, '**⚠️ WARNING:**')
    .replace(/<details>[\s\S]*?<\/details>/gi, '')
    .replace(/<summary>[\s\S]*?<\/summary>/gi, '')
    .trim();
}

function postprocessText(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '```$1\n$2```')
    .replace(/^```\n?/, '```')
    .replace(/```$/m, '```')
    .replace(/\n\n+/g, '\n\n')
    .replace(/([^\n]) \n/g, '$1  \n');
}

export async function translateProposal(
  apiKey: string,
  text: string,
  language: string,
  title: string
): Promise<string | null> {
  if (!apiKey) {
    console.error('DeepSeek API key not provided');
    return null;
  }

  const langName = LANGUAGE_NAMES[language] || language;
  const filteredText = filterTextByLanguage(text, language);
  const preprocessedText = preprocessText(filteredText);

  const client = new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL
  });

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert translator. Translate the following text into ${langName}. 
Rules:
1. IGNORE all content that is NOT in English or ${langName} (skip Chinese, Arabic, Korean, Japanese, Russian, etc.)
2. Provide a COMPLETE, faithful translation - do NOT summarize
3. Preserve ALL technical details, code snippets, specifications, tables, and formatting
4. Keep the original markdown structure
5. Keep EXACTLY two spaces at the end of lines that have a line break in the original (this is critical for markdown rendering)
6. For links like [link text](url), keep the "link text" in English - only translate the rest
7. ONLY output the translated proposal TEXT (not the title) - do NOT include any instructions, requirements, or prompts in your response
8. Do not add any commentary or explanations`
        },
        {
          role: 'user',
          content: `Translate this proposal into ${langName}. Ignore any non-English or non-${langName} content:\n\n${preprocessedText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 8000
    });

    let translated = response.choices[0]?.message?.content || null;
    
    if (translated) {
      translated = postprocessText(translated);
    }

    return translated;
  } catch (error: any) {
    console.error('DeepSeek translation error:', error.message);
    return null;
  }
}

export async function summarizeProposal(
  apiKey: string,
  text: string,
  language: string,
  title: string
): Promise<string | null> {
  if (!apiKey) {
    console.error('DeepSeek API key not provided');
    return null;
  }

  const langName = LANGUAGE_NAMES[language] || language;

  const client = new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL
  });

  const prompt = `
**SUMMARY TASK**:
Summarize the following Qubic Network proposal in 5-7 clear points in ${langName}.

**Requirements**:
1. Focus on the core content and key aspects
2. Use clear section headings in ${langName}
3. Maximum 2000 characters total
4. Cover: objectives, technical approach, innovative aspects, economic aspects, and expected impacts

**Proposal Title**: ${title}

**Proposal Text**:
${text}
`.trim();

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert technical summarizer. You provide concise summaries in the target language with clear section headings.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0]?.message?.content || null;
  } catch (error: any) {
    console.error('DeepSeek summary error:', error.message);
    return null;
  }
}
