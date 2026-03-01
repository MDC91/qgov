import { NextResponse } from 'next/server';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { 
  getProposalsByEpoch, 
  getProposalsByEpoch as getStoredProposals,
  getTranslation, 
  getAllTranslations,
  getBallotsByProposalId
} from '@/lib/database';
import { extractTitleFromUrl, extractTitleFromMarkdown } from '@/lib/proposal';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string }> }
) {
  try {
    const { epoch: epochStr } = await params;
    const epoch = parseInt(epochStr, 10);
    const currentEpoch = await getCurrentEpoch();

    let proposals = getStoredProposals(epoch);

    if (!proposals || proposals.length === 0) {
      return NextResponse.json({ proposals: [], message: 'No proposals found for this epoch' });
    }

    const proposalsWithData = await Promise.all(proposals.map(async (p: any) => {
      const translations = getAllTranslations(p.id);
      const ballots = getBallotsByProposalId(p.id);

      const translationsObj: Record<string, any> = {};
      for (const t of translations) {
        translationsObj[t.lang_code] = {
          text: t.text,
          updatedAt: new Date(t.updated_at).getTime()
        };
      }

      let title = p.title;
      if (!title || !p.title || p.title.includes('.md') || (p.title && p.title.includes(' at '))) {
        try {
          const markdownTitle = await extractTitleFromMarkdown(p.url);
          title = markdownTitle || extractTitleFromUrl(p.url) || 'Untitled Proposal';
        } catch {
          title = extractTitleFromUrl(p.url) || 'Untitled Proposal';
        }
      }

      return {
        id: p.id,
        epoch: p.epoch,
        title,
        url: p.url,
        status: p.status,
        yesVotes: p.yes_votes,
        noVotes: p.no_votes,
        totalVotes: p.total_votes,
        approvalRate: p.total_votes > 0 ? (p.yes_votes / p.total_votes) * 100 : 0,
        proposerIdentity: p.proposer_identity,
        contractName: p.contract_name,
        contractIndex: p.contract_index,
        proposalIndex: p.proposal_index,
        numberOfOptions: p.number_of_options,
        proposalType: p.proposal_type,
        published: p.published,
        publishedTick: p.published_tick,
        latestVoteTick: p.latest_vote_tick,
        translations: translationsObj,
        ballots: ballots
      };
    }));

    return NextResponse.json({ proposals: proposalsWithData });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}
