import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const keys = await kv.keys('epoch:*');
    
    const epochData: any = {};
    for (const key of keys) {
      const data = await kv.get(key);
      const epoch = key.split(':')[1];
      epochData[epoch] = {
        key,
        proposalsCount: Array.isArray(data) ? data.length : 'not array'
      };
    }

    return NextResponse.json({ 
      connected: true,
      totalKeys: keys.length,
      epochs: epochData
    });
  } catch (error: any) {
    return NextResponse.json({ 
      connected: false,
      error: error.message 
    }, { status: 500 });
  }
}
