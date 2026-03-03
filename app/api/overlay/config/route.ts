import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { DEFAULT_OVERLAY_CONFIG } from '@/app/streamer/overlay/types';

const resolveSessionToken = (request: NextRequest): string | null => {
  const cookieValue = request.cookies.get('streamer_session')?.value;
  if (!cookieValue) return null;

  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded) as { session_token?: string };
    return parsed.session_token ?? null;
  } catch {
    return decodeURIComponent(cookieValue);
  }
};

const getAuthorizedStreamerId = async (request: NextRequest) => {
  const token = resolveSessionToken(request);
  if (!token) return null;

  const session = await fetchQuery(api.auth.validateSession, { token });
  if (!session || session.type !== 'streamer') return null;

  return session.streamerId;
};

// GET /api/overlay/config - Get current user's overlay configuration
export async function GET(request: NextRequest) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const config = await fetchQuery(api.overlay.getOverlayConfig, { streamerId });

    return NextResponse.json({
      success: true,
      config: config || DEFAULT_OVERLAY_CONFIG,
    });

  } catch (error) {
    console.error('Get overlay config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/overlay/config - Update overlay configuration
export async function POST(request: NextRequest) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Config is required' },
        { status: 400 }
      );
    }

    await fetchMutation(api.overlay.saveOverlayConfig, {
      streamerId,
      config,
    });

    return NextResponse.json({
      success: true,
      message: 'Overlay configuration updated successfully',
    });

  } catch (error) {
    console.error('Update overlay config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}