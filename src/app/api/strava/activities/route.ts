import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getActivities } from '@/lib/strava';
import { getYearStartTimestamp, getYearEndTimestamp } from '@/lib/utils';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('strava_access_token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const yearStart = getYearStartTimestamp();
    const yearEnd = getYearEndTimestamp();
    
    const activities = await getActivities(
      accessToken.value,
      yearStart,
      yearEnd
    );
    
    const runningActivities = activities.filter(
      (activity: { type: string }) => activity.type === 'Run'
    );
    
    const totalDistance = runningActivities.reduce(
      (sum: number, activity: { distance: number }) => sum + activity.distance,
      0
    );
    
    const monthlyDistance = runningActivities.reduce((acc: Record<number, number>, activity: { start_date: string; distance: number }) => {
      const month = new Date(activity.start_date).getMonth();
      acc[month] = (acc[month] || 0) + activity.distance;
      return acc;
    }, {});

    return NextResponse.json({
      activities: runningActivities,
      totalDistance,
      monthlyDistance,
      count: runningActivities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}