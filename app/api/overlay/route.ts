import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

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

export async function POST(request: NextRequest) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await fetchMutation(api.overlay.regenerateOverlayToken, {
      streamerId,
    });

    return NextResponse.json({
      success: true,
      overlay_token: result.overlayToken,
    });

  } catch (error) {
    console.error('Generate overlay token API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}