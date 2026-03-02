import { NextResponse } from 'next/server';
import { translateProposal } from '@/lib/deepseek';
import { getProposalsByEpoch, getProposalById, getTranslation, setTranslation, getAllEpochs } from '@/lib/database';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { LANGUAGES } from '@/types';

const CRON_SECRET = process.env.CRON_SECRET;

let isTranslating = false;

export const maxDuration = 300;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isTranslating) {
    return NextResponse.json({ 
      status: 'skipped',
      reason: 'Translation already in progress'
    });
  }

  isTranslating = true;

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const results: any[] = [];

    const targetEpoch = url.searchParams.get('epoch');
    const targetProposalId = url.searchParams.get('proposalId');
    const currentEpochOnly = url.searchParams.get('current') === 'true';
    const refresh = url.searchParams.get('refresh') === 'true';

    let proposalsToProcess: { epoch: number; proposal: any }[] = [];

    if (targetEpoch && targetProposalId) {
      const proposal = getProposalById(targetProposalId);
      if (proposal && proposal.epoch === parseInt(targetEpoch, 10)) {
        proposalsToProcess.push({ epoch: parseInt(targetEpoch, 10), proposal });
      } else {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
      }
    } else if (currentEpochOnly) {
      const currentEpoch = await getCurrentEpoch();
      const proposals = getProposalsByEpoch(currentEpoch);
      for (const proposal of proposals) {
        proposalsToProcess.push({ epoch: currentEpoch, proposal });
      }
    } else {
      const epochs = getAllEpochs();
      for (const epoch of epochs) {
        const proposals = getProposalsByEpoch(epoch);
        for (const proposal of proposals) {
          proposalsToProcess.push({ epoch, proposal });
        }
      }
    }

    for (const { epoch, proposal } of proposalsToProcess) {
      const proposalId = proposal.id;
      const title = proposal.title || 'Qubic Proposal';
      
      for (const lang of LANGUAGES) {
        const existing = getTranslation(proposalId, lang.code);
        
        if (refresh || !existing || !existing.text) {
          let proposalText = '';
          try {
            if (proposal.url) {
              const rawUrl = proposal.url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
              const response = await fetch(rawUrl);
              proposalText = await response.text();
            }
          } catch (error) {
            console.error(`Failed to fetch proposal text for ${proposalId}:`, error);
            continue;
          }

          if (proposalText) {
            let translation: string | null = null;

            if (lang.code === 'en') {
              translation = proposalText;
              setTranslation(proposalId, lang.code, translation);
              results.push({ epoch, proposalId, lang: lang.code, status: 'original' });
            } else {
              if (!apiKey) {
                console.error('DeepSeek API key not configured');
                continue;
              }
              translation = await translateProposal(apiKey!, proposalText, lang.code, title);

              if (translation) {
                setTranslation(proposalId, lang.code, translation);
                results.push({ epoch, proposalId, lang: lang.code, status: 'translated' });
              }

              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      translated: results.length,
      details: results
    });
  } catch (error) {
    console.error('Translation cron error:', error);
    return NextResponse.json({ error: 'Translation cron failed' }, { status: 500 });
  } finally {
    isTranslating = false;
  }
}
