import { NextRequest, NextResponse } from 'next/server';
import { fetchAction } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moderator_id, password } = body;

    if (!moderator_id || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing moderator ID or password' },
        { status: 400 }
      );
    }

    const result = await fetchAction(api.auth.signInModerator, {
      moderatorId: moderator_id as Id<'moderators'>,
      password,
    });

    // 4. Create moderator session object
    const moderatorSession = {
      moderator_id: result.moderatorId,
      streamer_id: result.streamerId,
      streamer_name: result.streamerName,
      streamer_channel: result.streamerChannel,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      sessionToken: result.sessionToken,
      moderatorSession,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found') || message.includes('Invalid')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
      );
    }
    console.error('Moderator login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
