import { NextResponse } from 'next/server';
import { getComputorsByEpoch, getProposalsByEpoch, getBallotsByProposalId } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string }> }
) {
  try {
    const { epoch: epochStr } = await params;
    const epoch = parseInt(epochStr, 10);

    const computors = getComputorsByEpoch(epoch);
    const proposals = getProposalsByEpoch(epoch);
    
    const allProposalsData = proposals.map(p => {
      const ballots = getBallotsByProposalId(p.id);
      return {
        id: p.id,
        title: p.title,
        status: p.status,
        yesVotes: p.yes_votes,
        noVotes: p.no_votes,
        totalVotes: p.total_votes,
        ballots: ballots.map(b => ({
          computorId: b.computor_id,
          vote: b.vote
        }))
      };
    });
    
    const activeProposal = proposals.find(p => p.status === 2);
    const mainProposalData = activeProposal || proposals[0];
    
    if (!mainProposalData) {
      return NextResponse.json({ 
        computors: [], 
        ballots: [],
        proposal: null,
        allProposals: [],
        message: 'No proposals found for this epoch'
      });
    }

    const ballots = getBallotsByProposalId(mainProposalData.id);
    
    const mainProposal = {
      id: mainProposalData.id,
      title: mainProposalData.title,
      status: mainProposalData.status,
      yesVotes: mainProposalData.yes_votes,
      noVotes: mainProposalData.no_votes,
      totalVotes: mainProposalData.total_votes,
      ballots: ballots.map(b => ({
        computorId: b.computor_id,
        vote: b.vote
      }))
    };

    return NextResponse.json({
      computors: computors.map(c => c.computor_id),
      ballots: mainProposal.ballots,
      proposal: mainProposal,
      allProposals: allProposalsData
    });
  } catch (error) {
    console.error('Error fetching plenum data:', error);
    return NextResponse.json({ error: 'Failed to fetch plenum data' }, { status: 500 });
  }
}
