import { NextResponse } from 'next/server';
import { getAllStoredEpochs, getProposalsByEpoch, setTranslation } from '@/lib/database';
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
    const epochs = getAllStoredEpochs();
    const results: any[] = [];
    
    for (const epoch of epochs) {
      const proposals = getProposalsByEpoch(epoch);
      
      for (const proposal of proposals) {
        const proposalId = proposal.id;
        
        if (proposal.url && proposal.url.includes('github.com')) {
          const { content } = await extractTitleAndContentFromMarkdown(proposal.url);
          
          if (content.en) {
            setTranslation(proposalId, 'en', content.en);
            results.push({ epoch, id: proposalId, lang: 'en', stored: true });
          }
          
          if (content.zh) {
            setTranslation(proposalId, 'zh', content.zh);
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
