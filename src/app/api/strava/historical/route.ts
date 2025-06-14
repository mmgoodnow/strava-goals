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
  const sport = searchParams.get('sport') as SportType;
  
  if (!sport) {
    return NextResponse.json(
      { error: 'Sport parameter is required' },
      { status: 400 }
    );
  }

  try {
    
    const currentYear = new Date().getFullYear();
    const yearsToFetch = 5; // Fetch data for the last 5 years
    
    const yearlyData = [];
    
    for (let i = 0; i < yearsToFetch; i++) {
      const year = currentYear - i;
      const yearStart = Math.floor(new Date(year, 0, 1).getTime() / 1000);
      const yearEnd = Math.floor(new Date(year, 11, 31, 23, 59, 59).getTime() / 1000);
      
      try {
        const activities = await getActivities(
          accessToken.value,
          yearStart,
          yearEnd
        );
        
        const sportActivities = activities.filter(
          (activity: { type: string }) => activity.type === sport
        );
        
        // Calculate average pace and other metrics for the year
        const totalDistance = sportActivities.reduce(
          (sum: number, activity: { distance: number }) => sum + activity.distance,
          0
        );
        
        const totalTime = sportActivities.reduce(
          (sum: number, activity: { moving_time: number }) => sum + activity.moving_time,
          0
        );
        
        const averagePace = totalDistance > 0 ? totalTime / totalDistance : 0; // seconds per meter
        
        // Group activities by distance ranges for pace analysis
        const distanceRanges = {
          short: sportActivities.filter((a: { distance: number }) => a.distance < 5000), // < 5K
          medium: sportActivities.filter((a: { distance: number }) => a.distance >= 5000 && a.distance < 10000), // 5K-10K
          long: sportActivities.filter((a: { distance: number }) => a.distance >= 10000 && a.distance < 21097), // 10K-Half
          ultraLong: sportActivities.filter((a: { distance: number }) => a.distance >= 21097), // Half+
        };
        
        const rangeAnalysis = Object.entries(distanceRanges).reduce((acc, [range, activities]) => {
          if (activities.length > 0) {
            const rangeTotalDistance = activities.reduce((sum: number, a: { distance: number }) => sum + a.distance, 0);
            const rangeTotalTime = activities.reduce((sum: number, a: { moving_time: number }) => sum + a.moving_time, 0);
            acc[range] = {
              count: activities.length,
              averagePace: rangeTotalDistance > 0 ? rangeTotalTime / rangeTotalDistance : 0,
              totalDistance: rangeTotalDistance,
            };
          } else {
            acc[range] = {
              count: 0,
              averagePace: 0,
              totalDistance: 0,
            };
          }
          return acc;
        }, {} as Record<string, { count: number; averagePace: number; totalDistance: number }>);
        
        yearlyData.push({
          year,
          totalRuns: sportActivities.length,
          totalDistance,
          totalTime,
          averagePace,
          rangeAnalysis,
          activities: sportActivities,
        });
      } catch (yearError) {
        console.warn(`Failed to fetch data for year ${year}:`, yearError);
        // Continue with other years even if one fails
        yearlyData.push({
          year,
          totalRuns: 0,
          totalDistance: 0,
          totalTime: 0,
          averagePace: 0,
          rangeAnalysis: {},
          activities: [],
        });
      }
    }

    return NextResponse.json({
      yearlyData: yearlyData.filter(data => data.totalRuns > 0), // Only return years with data
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}