import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getActivities } from '@/lib/strava';
import { SportType } from '@/lib/utils';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('strava_access_token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const yearsBack = parseInt(searchParams.get('years') || '3');
  const sport = (searchParams.get('sport') as SportType) || 'Run';

  try {
    const currentYear = new Date().getFullYear();
    const allActivities = [];

    // Fetch activities for the specified number of years
    for (let i = 0; i < yearsBack; i++) {
      const year = currentYear - i;
      const yearStart = Math.floor(new Date(year, 0, 1).getTime() / 1000);
      const yearEnd = Math.floor(new Date(year, 11, 31, 23, 59, 59).getTime() / 1000);
      
      const yearActivities = await getActivities(
        accessToken.value,
        yearStart,
        yearEnd
      );
      
      allActivities.push(...yearActivities);
    }
    
    // Filter for specified sport activities and add pace/speed calculation
    const sportActivities = allActivities
      .filter((activity: { type: string }) => activity.type === sport)
      .map((activity: { 
        id: string; 
        name: string; 
        distance: number; 
        moving_time: number; 
        start_date: string;
      }) => ({
        id: activity.id,
        name: activity.name,
        distance: activity.distance,
        moving_time: activity.moving_time,
        start_date: activity.start_date,
        pace: activity.distance > 0 && activity.moving_time > 0 
          ? (activity.moving_time / 60) / (activity.distance * 0.000621371) // minutes per mile
          : 0
      }))
      .filter((activity: { pace: number }) => activity.pace > 0 && activity.pace < 20) // Filter out unrealistic paces
      .sort((a: { start_date: string }, b: { start_date: string }) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

    return NextResponse.json({
      activities: sportActivities,
      count: sportActivities.length,
      years: yearsBack
    });
  } catch (error) {
    console.error('Error fetching pace analysis data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pace analysis data' },
      { status: 500 }
    );
  }
}