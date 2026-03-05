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
    
    const activeProposal = proposals.find(p => p.status === 2);
    
    if (!activeProposal) {
      const latestProposal = proposals[0];
      if (!latestProposal) {
        return NextResponse.json({ 
          computors: [], 
          ballots: [],
          proposal: null,
          quorumReached: false,
          message: 'No proposals found for this epoch'
        });
      }

      const ballots = getBallotsByProposalId(latestProposal.id);
      
      return NextResponse.json({
        computors: computors.map(c => c.computor_id),
        ballots: ballots.map(b => ({
          computorId: b.computor_id,
          vote: b.vote
        })),
        proposal: {
          id: latestProposal.id,
          title: latestProposal.title,
          status: latestProposal.status,
          yesVotes: latestProposal.yes_votes,
          noVotes: latestProposal.no_votes,
          totalVotes: latestProposal.total_votes
        },
        quorumReached: latestProposal.total_votes >= 451
      });
    }

    const ballots = getBallotsByProposalId(activeProposal.id);

    return NextResponse.json({
      computors: computors.map(c => c.computor_id),
      ballots: ballots.map(b => ({
        computorId: b.computor_id,
        vote: b.vote
      })),
      proposal: {
        id: activeProposal.id,
        title: activeProposal.title,
        status: activeProposal.status,
        yesVotes: activeProposal.yes_votes,
        noVotes: activeProposal.no_votes,
        totalVotes: activeProposal.total_votes
      },
      quorumReached: activeProposal.total_votes >= 451
    });
  } catch (error) {
    console.error('Error fetching plenum data:', error);
    return NextResponse.json({ error: 'Failed to fetch plenum data' }, { status: 500 });
  }
}
