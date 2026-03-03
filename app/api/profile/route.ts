import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

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

    const profile = await fetchQuery(api.profile.getProfile, { streamerId });

    const mappedProfile =
      profile === null
        ? null
        : {
            id: profile._id,
            email: profile.email,
            name: profile.name,
            channel_name: profile.channelName,
            overlay_link: profile.overlayLink,
            overlay_token: profile.overlayToken,
            created_at: new Date(profile._creationTime).toISOString(),
            updated_at: new Date(profile._creationTime).toISOString(),
          };

    return NextResponse.json({
      success: true,
      profile: mappedProfile,
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const streamerId = await getAuthorizedStreamerId(request);
    if (!streamerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, channel_name, overlay_link } = body;

    const profile = await fetchMutation(api.profile.updateProfile, {
      streamerId,
      name: typeof name === 'string' ? name : undefined,
      channelName: typeof channel_name === 'string' ? channel_name : undefined,
      overlayLink: typeof overlay_link === 'string' ? overlay_link : undefined,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile._id,
        email: profile.email,
        name: profile.name,
        channel_name: profile.channelName,
        overlay_link: profile.overlayLink,
        overlay_token: profile.overlayToken,
        created_at: new Date(profile._creationTime).toISOString(),
        updated_at: new Date(profile._creationTime).toISOString(),
      },
    });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}