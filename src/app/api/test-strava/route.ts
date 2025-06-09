import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can reach Strava's API with your credentials
    const response = await fetch(
      `https://www.strava.com/api/v3/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.STRAVA_REDIRECT_URI || '')}&response_type=code&scope=read,activity:read_all`,
      { method: 'HEAD' }
    );
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      clientId: process.env.STRAVA_CLIENT_ID,
      redirectUri: process.env.STRAVA_REDIRECT_URI,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}