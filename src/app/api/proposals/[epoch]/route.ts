import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getAllTranslations, getEpochProposals, setEpochProposals } from '@/lib/cache';
import { extractTitleFromUrl, extractTitleFromMarkdown } from '@/lib/proposal';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string }> }
) {
  try {
    const { epoch: epochStr } = await params;
    const epoch = parseInt(epochStr, 10);
    const currentEpoch = await getCurrentEpoch();

    let proposals: any[] = [];

    // First check if we have stored proposals in Redis
    const storedProposals = await getEpochProposals(epoch);
    
    if (storedProposals && storedProposals.length > 0) {
      // Use stored proposals for historical data
      proposals = storedProposals;
    } else {
      // Fetch fresh from API
      if (epoch === currentEpoch) {
        proposals = await getActiveProposals();
      } else {
        proposals = await getEpochHistory(epoch);
      }
      
      // Store for future use (especially historical)
      if (proposals.length > 0 && epoch < currentEpoch) {
        await setEpochProposals(epoch, proposals);
      }
    }

    const proposalsWithTranslations = await Promise.all(proposals.map(async (p: any) => {
      const proposalId = p.id?.toString() || p.url;
      const translations = await getAllTranslations(epoch, proposalId);
      
      let yesVotes = 0;
      let noVotes = 0;
      let totalVotes = 0;
      
      // New format (165+): has yesVotes/noVotes directly
      if (p.yesVotes !== undefined) {
        yesVotes = p.yesVotes;
        noVotes = p.noVotes;
        totalVotes = p.totalVotes || 0;
      } 
      // Old format (134-164): has sumOption0/sumOption1
      else if (p.sumOption0 !== undefined || p.sumOption1 !== undefined) {
        yesVotes = parseInt(p.sumOption1 || '0', 10);
        noVotes = parseInt(p.sumOption0 || '0', 10);
        totalVotes = parseInt(p.totalVotes || '0', 10);
      }
      
      // Get title - prefer existing, then markdown, then URL
      let title = p.title;
      if (!title || title.includes('.md') || title.includes(' at ')) {
        const markdownTitle = await extractTitleFromMarkdown(p.url);
        title = markdownTitle || extractTitleFromUrl(p.url) || 'Untitled Proposal';
      }
      
      return {
        id: proposalId,
        epoch: p.epoch || epoch,
        title,
        url: p.url,
        status: p.status,
        yesVotes,
        noVotes,
        totalVotes,
        approvalRate: p.approval_rate || 0,
        proposerIdentity: p.proposerIdentity || null,
        translations
      };
    }));

    return NextResponse.json({ proposals: proposalsWithTranslations });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}
