import { NextRequest, NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { DEFAULT_OVERLAY_CONFIG } from '@/app/streamer/overlay/types';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

// GET /api/overlay/[token]/config - Get overlay configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    const config = await fetchQuery(api.overlay.getOverlayConfigByToken, { token });

    if (config === null) {
      const exists = await fetchQuery(api.overlay.getOverlayByToken, { token });
      if (!exists) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      config: config || DEFAULT_OVERLAY_CONFIG,
    });

  } catch (error) {
    console.error('Overlay config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}