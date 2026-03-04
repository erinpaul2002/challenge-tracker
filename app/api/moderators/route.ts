import { NextRequest, NextResponse } from 'next/server';
import { fetchAction, fetchQuery } from 'convex/nextjs';
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

export async function GET(request: NextRequest) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const moderators = await fetchQuery(api.moderators.getModerators, { streamerId });

    // Transform the data to include computed fields
    const transformedModerators = moderators?.map((mod: {
      _id: string;
      name: string;
      streamerId: string;
      active: boolean;
      _creationTime: number;
      challengesManaged?: number;
    }) => ({
      id: mod._id,
      name: mod.name,
      streamer_id: mod.streamerId,
      active: mod.active,
      created_at: new Date(mod._creationTime).toISOString(),
      updated_at: new Date(mod._creationTime).toISOString(),
      challenges_managed: mod.challengesManaged ?? 0,
    })) || [];

    return NextResponse.json({
      success: true,
      moderators: transformedModerators,
    });

  } catch (error) {
    console.error('Moderators API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { password, name } = body;

    // Validate required fields
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const created = await fetchAction(api.moderators.createModerator, {
      streamerId,
      name: name.trim(),
      password,
    });

    const moderators = await fetchQuery(api.moderators.getModerators, { streamerId });
    const moderator = moderators.find((m: { _id: string }) => m._id === created.moderatorId);

    return NextResponse.json({
      success: true,
      moderator: {
        id: created.moderatorId,
        name: moderator?.name ?? name.trim(),
        password, // Only show password on creation
        streamer_id: streamerId,
        created_at: moderator ? new Date(moderator._creationTime).toISOString() : new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Create moderator API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}