import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAthleteStats, getAthlete } from '@/lib/strava';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('strava_access_token');
  const athleteId = cookieStore.get('strava_athlete_id');

  if (!accessToken || !athleteId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const [stats, athlete] = await Promise.all([
      getAthleteStats(accessToken.value, parseInt(athleteId.value)),
      getAthlete(accessToken.value)
    ]);

    return NextResponse.json({
      stats,
      athlete,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}