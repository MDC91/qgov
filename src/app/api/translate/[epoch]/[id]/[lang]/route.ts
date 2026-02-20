import { NextResponse } from 'next/server';
import { translateProposal, summarizeProposal } from '@/lib/deepseek';
import { getTranslation, setTranslation, getAllTranslations } from '@/lib/cache';
import { LANGUAGES } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string; id: string; lang: string }> }
) {
  try {
    const { epoch: epochStr, id, lang } = await params;
    const epoch = parseInt(epochStr, 10);

    if (!LANGUAGES.some(l => l.code === lang)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const cachedTranslation = getTranslation(epoch, id, lang);
    if (cachedTranslation) {
      return NextResponse.json({ 
        translation: cachedTranslation,
        cached: true
      });
    }

    return NextResponse.json({ 
      error: 'Translation not found',
      available: getAllTranslations(epoch, id)
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
    const { epoch: epochStr, id, lang } = await params;
    const epoch = parseInt(epochStr, 10);
    const { url, title, force } = await request.json();

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    if (!LANGUAGES.some(l => l.code === lang)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    if (!force) {
      const cachedTranslation = getTranslation(epoch, id, lang);
      if (cachedTranslation) {
        return NextResponse.json({ 
          translation: cachedTranslation,
          cached: true
        });
      }
    }

    if (!url) {
      return NextResponse.json({ error: 'Proposal URL required' }, { status: 400 });
    }

    let proposalText = '';
    try {
      const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const response = await fetch(rawUrl);
      proposalText = await response.text();
    } catch (error) {
      console.error('Error fetching proposal text:', error);
      return NextResponse.json({ error: 'Failed to fetch proposal content' }, { status: 500 });
    }

    const translation = await translateProposal(
      apiKey,
      proposalText,
      lang,
      title || 'Qubic Proposal'
    );

    if (!translation) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    setTranslation(epoch, id, lang, translation);

    return NextResponse.json({ 
      translation,
      cached: false
    });
  } catch (error) {
    console.error('Error generating translation:', error);
    return NextResponse.json({ error: 'Failed to generate translation' }, { status: 500 });
  }
}
