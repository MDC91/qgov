import { NextResponse } from 'next/server';
import { getAllStoredEpochs, getEpochProposals, setTranslation } from '@/lib/cache';
import { extractTitleAndContentFromMarkdown } from '@/lib/proposal';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const epochs = await getAllStoredEpochs();
    const results: any[] = [];
    
    for (const epoch of epochs) {
      const proposals = await getEpochProposals(epoch);
      
      for (const proposal of proposals) {
        const proposalId = proposal.id?.toString() || proposal.url;
        
        if (proposal.url && proposal.url.includes('github.com')) {
          const { content } = await extractTitleAndContentFromMarkdown(proposal.url);
          
          if (content.en) {
            await setTranslation(epoch, proposalId, 'en', content.en);
            results.push({ epoch, id: proposalId, lang: 'en', stored: true });
          }
          
          if (content.zh) {
            await setTranslation(epoch, proposalId, 'zh', content.zh);
            results.push({ epoch, id: proposalId, lang: 'zh', stored: true });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      details: results.slice(0, 50)
    });
  } catch (error) {
    console.error('Fetch content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
