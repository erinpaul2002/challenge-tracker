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

const getStreamerAccess = async (request: NextRequest): Promise<string | null> => {
  const token = resolveSessionToken(request);
  if (token) {
    const session = await fetchQuery(api.auth.validateSession, { token });
    if (session?.type === 'streamer') {
      return session.streamerId;
    }
  }

  const moderatorSession = request.headers.get('x-moderator-session');
  if (!moderatorSession) return null;

  try {
    const parsed = JSON.parse(moderatorSession) as { streamer_id?: string };
    return parsed.streamer_id ?? null;
  } catch (error) {
    console.error('Invalid moderator session:', error);
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

    const challenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId: challengeId as Id<'challenges'>,
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found or access denied' },
        { status: 404 }
      );
    }

    if (challenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subChallenges = await fetchQuery(api.challenges.getSubChallenges, {
      challengeId: challengeId as Id<'challenges'>,
    });

    return NextResponse.json({
      success: true,
      subChallenges: subChallenges.map(mapSubChallenge),
    });

  } catch (error) {
    console.error('Sub-challenges API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Challenge not found or access denied' },
        { status: 404 }
      );
    }

    if (challenge.streamerId !== streamerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, target_limit } = body;

    // Validate required fields
    if (!title || typeof target_limit !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Title and target_limit are required' },
        { status: 400 }
      );
    }

    const subChallengeId = await fetchMutation(api.challenges.createSubChallenge, {
      challengeId: challengeId as Id<'challenges'>,
      title,
      description,
      targetLimit: target_limit,
    });

    const subChallenges = await fetchQuery(api.challenges.getSubChallenges, {
      challengeId: challengeId as Id<'challenges'>,
    });

    const subChallenge = subChallenges.find((sub: { _id: string }) => sub._id === subChallengeId);

    if (!subChallenge) {
      return NextResponse.json(
        { success: false, error: 'Sub-challenge creation verification failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subChallenge: mapSubChallenge(subChallenge),
    });

  } catch (error) {
    console.error('Create sub-challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}