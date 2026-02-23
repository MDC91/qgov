import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { translateProposal } from '@/lib/deepseek';
import { getTranslation, setTranslation, getEpochProposals, setEpochProposals } from '@/lib/cache';
import { LANGUAGES } from '@/types';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    const currentEpoch = await getCurrentEpoch();
    const results: any[] = [];

    // Current epoch: always fetch fresh
    let proposals = await getActiveProposals();
    
    // Store current epoch proposals
    if (proposals.length > 0) {
      setEpochProposals(currentEpoch, proposals);
    }
    
    // Process current epoch translations
    for (const proposal of proposals) {
      const proposalId = proposal.id?.toString() || proposal.url;
      const title = proposal.title || 'Qubic Proposal';
      
      for (const lang of LANGUAGES) {
        const existing = await getTranslation(currentEpoch, proposalId, lang.code);
        
        if (!existing) {
          let proposalText = '';
          try {
            const rawUrl = proposal.url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            const response = await fetch(rawUrl);
            proposalText = await response.text();
          } catch (error) {
            console.error(`Failed to fetch proposal text for ${proposalId}:`, error);
            continue;
          }

          if (proposalText) {
            let translation: string | null = null;

            if (lang.code === 'en') {
              translation = proposalText;
              await setTranslation(currentEpoch, proposalId, lang.code, translation);
              results.push({ epoch: currentEpoch, proposalId, lang: lang.code, status: 'original' });
            } else {
              if (!apiKey) {
                console.error('DeepSeek API key not configured');
                continue;
              }
              translation = await translateProposal(apiKey!, proposalText, lang.code, title);

              if (translation) {
                await setTranslation(currentEpoch, proposalId, lang.code, translation);
                results.push({ epoch: currentEpoch, proposalId, lang: lang.code, status: 'translated' });
              }

              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }
    }

    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Historical epochs: fetch and store
    for (let epoch = currentEpoch - 1; epoch >= 1; epoch--) {
      const existing = await getEpochProposals(epoch);
      
      // Fetch if no existing data OR if force refresh is enabled
      if (!existing || existing.length === 0 || forceRefresh) {
        const historicalProposals = await getEpochHistory(epoch);
        
        if (historicalProposals.length > 0) {
          await setEpochProposals(epoch, historicalProposals);
          results.push({ epoch, proposalsStored: historicalProposals.length, status: 'historical_fetched' });
        } else if (forceRefresh && existing.length > 0) {
          // Keep existing if no new data found but refresh was requested
          results.push({ epoch, proposalsStored: existing.length, status: 'historical_unchanged' });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      translated: results.length,
      details: results
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
