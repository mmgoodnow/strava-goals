import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/strava';

export async function GET() {
  try {
    const authUrl = getAuthorizationUrl();
    console.log('Generated auth URL:', authUrl);
    
    // Let's also try constructing the URL manually to debug
    const manualUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.STRAVA_REDIRECT_URI || '')}&response_type=code&scope=read,activity:read_all`;
    console.log('Manual URL:', manualUrl);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}