import { NextRequest, NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    const overlayData = await fetchQuery(api.overlay.getOverlayByToken, { token });

    if (!overlayData) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      challenges: overlayData.challenges || [],
      streamer_id: overlayData.streamerId,
    });

  } catch (error) {
    console.error('Overlay API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}