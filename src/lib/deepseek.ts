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

function filterTextByLanguage(text: string, _targetLang: string): string {
  const mixedForeignScripts = /[\u4e00-\u9fff\u3400-\u4dbf\u0600-\u06ff\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/;
  
  const lines = text.split('\n');
  const filtered: string[] = [];
  
  for (const line of lines) {
    if (mixedForeignScripts.test(line)) {
      continue;
    }

    filtered.push(line);
  }

  return filtered.join('\n');
}

function preprocessText(text: string): string {
  text = text
    .replace(/\[!IMPORTANT\]/gi, '**⚠️ IMPORTANT:**')
    .replace(/\[!NOTE\]/gi, '**📝 NOTE:**')
    .replace(/\[!WARNING\]/gi, '**⚠️ WARNING:**');
  
  return text.trim();
}

function postprocessText(text: string): string {
  text = text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '```$1\n$2```')
    .replace(/^```\n?/, '```')
    .replace(/```$/m, '```')
    .replace(/\n\n+/g, '\n\n')
    .replace(/([^\n]) \n/g, '$1  \n');

  text = text.replace(/^\s*#\s+.*\n+/, '');
  
  text = text.replace(/<details>/gi, '\n<details>');
  text = text.replace(/<\/details>/gi, '</details>\n');
  text = text.replace(/<summary>/gi, '<summary>');
  text = text.replace(/<\/summary>/gi, '</summary>');
  
  return text;
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
7. Do NOT output the proposal title and do NOT add a top-level '# ' heading
8. Translate every section from start to end; do not skip options/checklists/tables/TOC entries
9. ONLY output the translated proposal TEXT - do NOT include any instructions, requirements, prompts, or commentary`
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
