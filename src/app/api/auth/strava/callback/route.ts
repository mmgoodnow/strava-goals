import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken } from '@/lib/strava';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/?error=${error}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/?error=no_code`
    );
  }

  try {
    const tokenData = await exchangeToken(code);
    
    const cookieStore = await cookies();
    cookieStore.set('strava_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
    });
    
    cookieStore.set('strava_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    cookieStore.set('strava_athlete_id', tokenData.athlete.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/`
    );
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/?error=token_exchange_failed`
    );
  }
}