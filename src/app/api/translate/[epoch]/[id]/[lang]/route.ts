import { NextResponse } from 'next/server';
import { translateProposal } from '@/lib/deepseek';
import { getTranslation, setTranslation, getAllTranslations as getAllTranslationsFromDb } from '@/lib/database';
import { splitMarkdownTitleAndBody, filterEnglishMarkdownBody, ensureMarkdownTitle } from '@/lib/proposal';
import { LANGUAGES } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string; id: string; lang: string }> }
) {
  try {
    const { id, lang } = await params;

    if (!LANGUAGES.some(l => l.code === lang)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const translation = getTranslation(id, lang);
    if (translation && translation.text) {
      return NextResponse.json({ 
        translation: translation.text,
        cached: true
      });
    }

    return NextResponse.json({ 
      error: 'Translation not found',
      available: getAllTranslationsFromDb(id).map(t => t.lang_code)
    }, { status: 404 });
  } catch (error) {
    console.error('Error fetching translation:', error);
    return NextResponse.json({ error: 'Failed to fetch translation' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ epoch: string; id: string; lang: string }> }
) {
  try {
    const { id, lang } = await params;
    const { url, title, force } = await request.json();

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    if (!LANGUAGES.some(l => l.code === lang)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    if (!force) {
      const translation = getTranslation(id, lang);
      if (translation && translation.text) {
        return NextResponse.json({ 
          translation: translation.text,
          cached: true
        });
      }
    }

    if (!url) {
      return NextResponse.json({ error: 'Proposal URL required' }, { status: 400 });
    }

    let rawMarkdown = '';
    try {
      const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const response = await fetch(rawUrl);
      rawMarkdown = await response.text();
    } catch (error) {
      console.error('Error fetching proposal text:', error);
      return NextResponse.json({ error: 'Failed to fetch proposal content' }, { status: 500 });
    }

    const { title: markdownTitle, body } = splitMarkdownTitleAndBody(rawMarkdown);
    const englishBody = filterEnglishMarkdownBody(body);
    const displayTitle = title || markdownTitle || 'Qubic Proposal';

    if (!englishBody) {
      return NextResponse.json({ error: 'Failed to extract English proposal content' }, { status: 500 });
    }

    if (lang === 'en') {
      const englishWithTitle = ensureMarkdownTitle(displayTitle, englishBody);
      setTranslation(id, 'en', englishWithTitle);
      return NextResponse.json({
        translation: englishWithTitle,
        cached: false
      });
    }

    const translation = await translateProposal(
      apiKey,
      englishBody,
      lang,
      title || markdownTitle || 'Qubic Proposal'
    );

    if (!translation) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    const translationWithTitle = ensureMarkdownTitle(displayTitle, translation);

    setTranslation(id, lang, translationWithTitle);

    return NextResponse.json({ 
      translation: translationWithTitle,
      cached: false
    });
  } catch (error) {
    console.error('Error generating translation:', error);
    return NextResponse.json({ error: 'Failed to generate translation' }, { status: 500 });
  }
}
