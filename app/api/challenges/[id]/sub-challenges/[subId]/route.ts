import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface RouteParams {
  params: Promise<{
    id: string;
    subId: string;
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

  return decodeURIComponent(cookieValue);
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

const mapSubChallenge = (sub: {
  _id: string;
  _creationTime: number;
  challengeId: string;
  title: string;
  description?: string;
  currentProgress: number;
  targetLimit: number;
  status: 'active' | 'completed' | 'paused';
}) => ({
  id: sub._id,
  challenge_id: sub.challengeId,
  title: sub.title,
  description: sub.description,
  current_progress: sub.currentProgress,
  target_limit: sub.targetLimit,
  status: sub.status,
  created_at: new Date(sub._creationTime).toISOString(),
  updated_at: new Date(sub._creationTime).toISOString(),
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
    const subId = resolvedParams.subId;

    const challenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!challenge || challenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subs = await fetchQuery(api.challenges.getSubChallenges, {
      challengeId: challengeId as Id<'challenges'>,
    });

    const subChallenge = subs.find((sub: { _id: string }) => sub._id === subId);

    if (!subChallenge) {
      return NextResponse.json(
        { success: false, error: 'Sub-challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subChallenge: mapSubChallenge(subChallenge),
    });

  } catch (error) {
    console.error('Get sub-challenge API error:', error);
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
    const subId = resolvedParams.subId;

    const challenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!challenge || challenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const currentSubs = await fetchQuery(api.challenges.getSubChallenges, {
      challengeId: challengeId as Id<'challenges'>,
    });

    const existingSub = currentSubs.find((sub: { _id: string }) => sub._id === subId);
    if (!existingSub) {
      return NextResponse.json(
        { success: false, error: 'Sub-challenge not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, target_limit, current_progress, status } = body;

    const subChallenge = await fetchMutation(api.challenges.updateSubChallenge, {
      sessionToken,
      subChallengeId: subId as Id<'subChallenges'>,
      title: title !== undefined ? title : undefined,
      description: description !== undefined ? description : undefined,
      targetLimit: target_limit !== undefined ? target_limit : undefined,
      currentProgress: current_progress !== undefined ? current_progress : undefined,
      status: status !== undefined ? status : undefined,
    });

    if (!subChallenge || subChallenge.challengeId !== challengeId) {
      return NextResponse.json(
        { success: false, error: 'Sub-challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subChallenge: mapSubChallenge(subChallenge),
    });

  } catch (error) {
    console.error('Update sub-challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const subId = resolvedParams.subId;

    const challenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!challenge || challenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subs = await fetchQuery(api.challenges.getSubChallenges, {
      challengeId: challengeId as Id<'challenges'>,
    });
    const existingSub = subs.find((sub: { _id: string }) => sub._id === subId);

    if (!existingSub) {
      return NextResponse.json(
        { success: false, error: 'Sub-challenge not found' },
        { status: 404 }
      );
    }

    await fetchMutation(api.challenges.deleteSubChallenge, {
      subChallengeId: subId as Id<'subChallenges'>,
    });

    return NextResponse.json({
      success: true,
      message: 'Sub-challenge deleted successfully',
    });

  } catch (error) {
    console.error('Delete sub-challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}