import { NextRequest, NextResponse } from 'next/server';
import { fetchAction, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  channel_name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json();
    const { email, password, name, channel_name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const result = await fetchAction(api.auth.signUpStreamer, {
      email,
      password,
      name,
      channelName: channel_name,
    });

    const streamer = await fetchQuery(api.auth.getStreamerByEmail, { email });

    if (!streamer) {
      return NextResponse.json(
        { success: false, error: 'User creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: streamer._id,
        email: streamer.email,
        name: streamer.name,
        channel_name: streamer.channelName,
      },
      session: {
        token: result.sessionToken,
        type: 'streamer',
      },
      message: 'Signup successful',
    });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
