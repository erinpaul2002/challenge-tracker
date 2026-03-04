import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

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

const resolveModeratorSessionToken = (request: NextRequest): string | null => {
  const headerToken = request.headers.get('x-moderator-session')?.trim();
  if (headerToken) {
    return headerToken;
  }

  const cookieValue = request.cookies.get('moderator_session')?.value;
  if (!cookieValue) return null;

  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded) as { session_token?: string };
    return parsed.session_token ?? decoded;
  } catch {
    return decodeURIComponent(cookieValue);
  }
};

const getStreamerAccess = async (request: NextRequest): Promise<string | null> => {
  const token = resolveSessionToken(request);
  if (token) {
    const session = await fetchQuery(api.auth.validateSession, { token });
    if (session?.type === 'streamer') {
      return session.streamerId;
    }
  }

  const moderatorToken = resolveModeratorSessionToken(request);
  if (!moderatorToken) return null;

  try {
    const session = await fetchQuery(api.auth.validateSession, { token: moderatorToken });
    if (session?.type === 'moderator') {
      return session.streamerId;
    }

    console.warn('Moderator session verification failed: token invalid, expired, or not a moderator session');
    return null;
  } catch (error) {
    console.error('Moderator session verification error:', error);
    return null;
  }
};

const mapChallenge = (challenge: {
  _id: string;
  _creationTime: number;
  streamerId: string;
  title: string;
  description?: string;
  givenBy?: string;
  deadline?: string;
  rewardAmount?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}) => ({
  id: challenge._id,
  streamer_id: challenge.streamerId,
  title: challenge.title,
  description: challenge.description,
  given_by: challenge.givenBy,
  deadline: challenge.deadline,
  reward_amount: challenge.rewardAmount,
  status: challenge.status,
  created_at: new Date(challenge._creationTime).toISOString(),
  updated_at: new Date(challenge._creationTime).toISOString(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const streamerId = await getStreamerAccess(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const challengeId = resolvedParams.id;

    const challenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify the challenge belongs to the current streamer
    if (challenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge: mapChallenge(challenge),
    });

  } catch (error) {
    console.error('Get challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const streamerId = await getStreamerAccess(request);
    const sessionToken =
      resolveModeratorSessionToken(request) ?? resolveSessionToken(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const challengeId = resolvedParams.id;
    const body = await request.json();
    const { title, description, given_by, deadline, reward_amount, status } = body;

    const existingChallenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!existingChallenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (existingChallenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const updatedChallenge = await fetchMutation(api.challenges.updateChallenge, {
      sessionToken,
      challengeId: challengeId as Id<'challenges'>,
      title,
      description,
      givenBy: given_by,
      deadline,
      rewardAmount: reward_amount,
      status,
    });

    if (!updatedChallenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge: mapChallenge(updatedChallenge),
    });

  } catch (error) {
    console.error('Update challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const streamerId = await getStreamerAccess(request);
    const sessionToken =
      resolveModeratorSessionToken(request) ?? resolveSessionToken(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const challengeId = resolvedParams.id;

    const existingChallenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!existingChallenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (existingChallenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    await fetchMutation(api.challenges.deleteChallenge, {
      sessionToken,
      challengeId: challengeId as Id<'challenges'>,
    });

    return NextResponse.json({
      success: true,
      message: 'Challenge deleted successfully',
    });

  } catch (error) {
    console.error('Delete challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}