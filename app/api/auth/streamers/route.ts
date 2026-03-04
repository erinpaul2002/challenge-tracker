import { NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

interface ModeratorLoginOption {
  moderatorId: string;
  streamerId: string;
  name: string;
  channelName?: string;
}

export async function GET() {
  try {
    const options = await fetchQuery(api.moderators.getModeratorLoginOptions, {});

    const streamerOptions = (options as ModeratorLoginOption[])
      .map((option) => ({
        id: option.moderatorId,
        name: option.name,
        channel_name: option.channelName,
        streamer_id: option.streamerId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      streamers: streamerOptions,
    });
  } catch (error) {
    console.error('Error fetching streamers for login:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch streamers' },
      { status: 500 }
    );
  }
}
