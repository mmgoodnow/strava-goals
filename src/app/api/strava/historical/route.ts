import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getActivities } from '@/lib/strava';

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
        
        const runningActivities = activities.filter(
          (activity: { type: string }) => activity.type === 'Run'
        );
        
        // Calculate average pace and other metrics for the year
        const totalDistance = runningActivities.reduce(
          (sum: number, activity: { distance: number }) => sum + activity.distance,
          0
        );
        
        const totalTime = runningActivities.reduce(
          (sum: number, activity: { moving_time: number }) => sum + activity.moving_time,
          0
        );
        
        const averagePace = totalDistance > 0 ? totalTime / totalDistance : 0; // seconds per meter
        
        // Group runs by distance ranges for pace analysis
        const distanceRanges = {
          short: runningActivities.filter((a: { distance: number }) => a.distance < 5000), // < 5K
          medium: runningActivities.filter((a: { distance: number }) => a.distance >= 5000 && a.distance < 10000), // 5K-10K
          long: runningActivities.filter((a: { distance: number }) => a.distance >= 10000 && a.distance < 21097), // 10K-Half
          ultraLong: runningActivities.filter((a: { distance: number }) => a.distance >= 21097), // Half+
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
          totalRuns: runningActivities.length,
          totalDistance,
          totalTime,
          averagePace,
          rangeAnalysis,
          activities: runningActivities,
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