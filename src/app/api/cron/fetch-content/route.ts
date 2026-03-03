import { NextResponse } from 'next/server';
import { getAllEpochs, getProposalsByEpoch, setTranslation } from '@/lib/database';
import { extractTitleAndContentFromMarkdown, ensureMarkdownTitle } from '@/lib/proposal';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const epochs = getAllEpochs();
    const results: any[] = [];
    
    for (const epoch of epochs) {
      const proposals = getProposalsByEpoch(epoch);
      
      for (const proposal of proposals) {
        const proposalId = proposal.id;
        
        if (proposal.url && proposal.url.includes('github.com')) {
          const { title, content } = await extractTitleAndContentFromMarkdown(proposal.url);
          
          if (content.en) {
            const displayTitle = title || proposal.title || 'Qubic Proposal';
            setTranslation(proposalId, 'en', ensureMarkdownTitle(displayTitle, content.en));
            results.push({ epoch, id: proposalId, lang: 'en', stored: true });
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
