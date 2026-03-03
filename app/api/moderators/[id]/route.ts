import { NextRequest, NextResponse } from 'next/server';
import { fetchAction, fetchMutation, fetchQuery } from 'convex/nextjs';
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

const getAuthorizedStreamerId = async (request: NextRequest) => {
  const token = resolveSessionToken(request);
  if (!token) return null;

  const session = await fetchQuery(api.auth.validateSession, { token });
  if (!session || session.type !== 'streamer') return null;

  return session.streamerId;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const moderatorId = resolvedParams.id;

    const moderators = await fetchQuery(api.moderators.getModerators, { streamerId });
    const existingModerator = moderators.find((m: { _id: string }) => m._id === moderatorId);

    if (!existingModerator) {
      return NextResponse.json(
        { success: false, error: 'Moderator not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, password, active } = body;

    // Validate input
    const updates: {
      name?: string;
      password?: string;
      active?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      updates.password = password;
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Active must be a boolean' },
          { status: 400 }
        );
      }
      updates.active = active;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await fetchAction(api.moderators.updateModerator, {
      moderatorId: moderatorId as Id<'moderators'>,
      name: updates.name,
      password: updates.password,
      active: updates.active,
    });

    const refreshed = await fetchQuery(api.moderators.getModerators, { streamerId });
    const moderator = refreshed.find((m: { _id: string }) => m._id === moderatorId);

    if (!moderator) {
      return NextResponse.json(
        { success: false, error: 'Moderator not found after update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      moderator: {
        id: moderator._id,
        name: moderator.name,
        streamer_id: moderator.streamerId,
        active: moderator.active,
        created_at: new Date(moderator._creationTime).toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Update moderator API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const moderatorId = resolvedParams.id;

    const moderators = await fetchQuery(api.moderators.getModerators, { streamerId });
    const moderator = moderators.find((m: { _id: string }) => m._id === moderatorId);

    if (!moderator) {
      return NextResponse.json(
        { success: false, error: 'Moderator not found or access denied' },
        { status: 404 }
      );
    }

    await fetchMutation(api.moderators.deleteModerator, {
      moderatorId: moderatorId as Id<'moderators'>,
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Delete moderator API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}