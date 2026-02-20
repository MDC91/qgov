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
1. Provide a COMPLETE, faithful translation - do NOT summarize
2. Preserve ALL technical details, code snippets, specifications, tables, and formatting
3. Keep the original markdown structure
4. ONLY output the translated proposal text - do NOT include any instructions, requirements, or prompts in your response
5. Do not add any commentary or explanations`
        },
        {
          role: 'user',
          content: `Translate this proposal into ${langName}:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 8000
    });

    return response.choices[0]?.message?.content || null;
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
