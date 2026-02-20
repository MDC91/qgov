import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { translateProposal } from '@/lib/deepseek';
import { getTranslation, setTranslation } from '@/lib/cache';
import { LANGUAGES } from '@/types';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    const currentEpoch = await getCurrentEpoch();
    const epochs = Array.from({ length: 10 }, (_, i) => currentEpoch - i);

    const results: any[] = [];

    for (const epoch of epochs) {
      let proposals: any[] = [];
      
      if (epoch === currentEpoch) {
        proposals = await getActiveProposals();
      } else {
        proposals = await getEpochHistory(epoch);
      }

      for (const proposal of proposals) {
        const proposalId = proposal.id?.toString() || proposal.url;
        const title = proposal.title || 'Qubic Proposal';
        
        for (const lang of LANGUAGES) {
          const existing = getTranslation(epoch, proposalId, lang.code);
          
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
                setTranslation(epoch, proposalId, lang.code, translation);
                results.push({ epoch, proposalId, lang: lang.code, status: 'original' });
              } else {
                if (!apiKey) {
                  console.error('DeepSeek API key not configured');
                  continue;
                }
                translation = await translateProposal(apiKey!, proposalText, lang.code, title);

                if (translation) {
                  setTranslation(epoch, proposalId, lang.code, translation);
                  results.push({ epoch, proposalId, lang: lang.code, status: 'translated' });
                }

                await new Promise(resolve => setTimeout(resolve, 500));
              }
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
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
