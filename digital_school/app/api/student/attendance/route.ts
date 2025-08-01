import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(request);
    if (!tokenData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Replace with real attendance fetch when attendance table is available
    // For now, return mock data
    return NextResponse.json({
      summary: {
        percentage: 94,
        present: 18,
        absent: 1,
        late: 1,
        total: 20,
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
} 