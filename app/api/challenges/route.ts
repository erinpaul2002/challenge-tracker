import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

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
  // TODO(schema): Add an explicit `updatedAt` field to challenges so API callers
  // can receive a true modification timestamp.
  updated_at: undefined,
});

export async function GET(request: NextRequest) {
  try {
    const streamerId = await getStreamerAccess(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const challenges = await fetchQuery(api.challenges.getChallenges, {
      streamerId: streamerId as Id<'streamers'>,
    });

    return NextResponse.json({
      success: true,
      challenges: challenges.map(mapChallenge),
    });

  } catch (error) {
    console.error('Challenges API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const streamerId = await getStreamerAccess(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { title, description, given_by, deadline, reward_amount, subChallenges } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate sub-challenges
    if (!subChallenges || !Array.isArray(subChallenges) || subChallenges.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one objective is required' },
        { status: 400 }
      );
    }

    // Validate each sub-challenge has required fields
    for (const sub of subChallenges) {
      if (!sub.title || !sub.target_limit || sub.target_limit < 1) {
        return NextResponse.json(
          { success: false, error: 'All objectives must have a title and valid target limit' },
          { status: 400 }
        );
      }
    }

    const challengeId = await fetchMutation(api.challenges.createChallenge, {
      streamerId: streamerId as Id<'streamers'>,
      title,
      description,
      givenBy: given_by,
      deadline,
      rewardAmount: reward_amount,
      subChallenges: subChallenges.map((sub: { title: string; description?: string; target_limit: number }) => ({
        title: sub.title,
        description: sub.description,
        targetLimit: sub.target_limit,
      })),
    });

    const challenge = await fetchQuery(api.challenges.getChallenge, {
      challengeId,
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge creation verification failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge: mapChallenge(challenge),
    });

  } catch (error) {
    console.error('Create challenge API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}