import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getActivities, getAthlete } from '@/lib/strava';
import { SportType } from '@/lib/utils';

const DEFAULT_RESTING_HR = 60;
const DEFAULT_MAX_HR = 190;
const MIN_EFFORT_FRACTION = 0.5;
const MAX_EFFORT_FRACTION = 0.95;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const asFiniteNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const estimateVo2DemandFromPower = (watts: number | null, weightKg: number | null): number | null => {
  if (!watts || watts <= 0 || !weightKg || weightKg <= 0) return null;
  // Cycling-derived conversion used as a running-power proxy.
  return 10.8 * (watts / weightKg) + 7;
};

const estimateVo2DemandFromPaceGrade = (
  distanceMeters: number,
  movingTimeSeconds: number,
  elevationGainMeters: number | null
): number | null => {
  if (distanceMeters <= 0 || movingTimeSeconds <= 0) return null;

  const speedMetersPerMinute = (distanceMeters / movingTimeSeconds) * 60;
  if (speedMetersPerMinute <= 0) return null;

  const rawGrade = elevationGainMeters && distanceMeters > 0 ? elevationGainMeters / distanceMeters : 0;
  const grade = clamp(rawGrade, -0.15, 0.15);

  // ACSM running equation proxy: VO2 demand from speed + grade.
  return 0.2 * speedMetersPerMinute + 0.9 * speedMetersPerMinute * grade + 3.5;
};

const estimateEffortFraction = (
  averageHr: number | null,
  restingHr: number,
  maxHr: number
): number | null => {
  if (!averageHr || averageHr <= restingHr) return null;
  const reserve = maxHr - restingHr;
  if (reserve <= 0) return null;

  const raw = (averageHr - restingHr) / reserve;
  return clamp(raw, MIN_EFFORT_FRACTION, MAX_EFFORT_FRACTION);
};

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
  const yearsBack = parseInt(searchParams.get('years') || '1');
  const sport = searchParams.get('sport') as SportType;
  
  if (!sport) {
    return NextResponse.json(
      { error: 'Sport parameter is required' },
      { status: 400 }
    );
  }

  try {
    let athlete: {
      weight?: number;
      resting_heart_rate?: number;
      max_heartrate?: number;
    } | null = null;
    try {
      athlete = await getAthlete(accessToken.value);
    } catch (athleteError) {
      console.warn('Could not fetch athlete profile for VO2 estimation:', athleteError);
    }

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

    const rawSportActivities = allActivities
      .filter((activity: { type: string }) => activity.type === sport)
      .map((activity: { 
        id: string; 
        name: string; 
        distance: number; 
        moving_time: number; 
        start_date: string;
        average_heartrate?: number | null;
        max_heartrate?: number | null;
        average_watts?: number | null;
        total_elevation_gain?: number | null;
      }) => ({
        id: activity.id,
        name: activity.name,
        distance: activity.distance,
        moving_time: activity.moving_time,
        start_date: activity.start_date,
        heart_rate: typeof activity.average_heartrate === 'number' ? activity.average_heartrate : null,
        max_heart_rate: typeof activity.max_heartrate === 'number' ? activity.max_heartrate : null,
        average_watts: typeof activity.average_watts === 'number' ? activity.average_watts : null,
        total_elevation_gain: typeof activity.total_elevation_gain === 'number' ? activity.total_elevation_gain : null,
        pace: activity.distance > 0 && activity.moving_time > 0 
          ? (activity.moving_time / 60) / (activity.distance * 0.000621371) // minutes per mile
          : 0
      }))
      .filter((activity: { pace: number }) => activity.pace > 0 && activity.pace < 20);

    const athleteWeightKg = asFiniteNumber(athlete?.weight);
    const athleteRestingHr = asFiniteNumber(athlete?.resting_heart_rate);
    const athleteMaxHr = asFiniteNumber(athlete?.max_heartrate);

    const observedMaxHeartRate = rawSportActivities.reduce((max, activity) => {
      const value = activity.max_heart_rate ?? null;
      return value && value > max ? value : max;
    }, 0);
    const observedAvgHeartRate = rawSportActivities.reduce((max, activity) => {
      const value = activity.heart_rate ?? null;
      return value && value > max ? value : max;
    }, 0);

    const restingHr = athleteRestingHr && athleteRestingHr >= 35 && athleteRestingHr <= 100
      ? athleteRestingHr
      : DEFAULT_RESTING_HR;
    const estimatedMaxHr = athleteMaxHr && athleteMaxHr >= 160 && athleteMaxHr <= 220
      ? athleteMaxHr
      : observedMaxHeartRate > 0
        ? clamp(observedMaxHeartRate, 170, 210)
        : observedAvgHeartRate > 0
          ? clamp(observedAvgHeartRate + 15, 170, 205)
          : DEFAULT_MAX_HR;

    // Build per-activity VO2 proxy with fallback: power -> pace+grade
    const sportActivities = rawSportActivities
      .map((activity) => {
        const vo2DemandFromPower = estimateVo2DemandFromPower(activity.average_watts, athleteWeightKg);
        const vo2DemandFromPaceGrade = estimateVo2DemandFromPaceGrade(
          activity.distance,
          activity.moving_time,
          activity.total_elevation_gain
        );

        const vo2Demand = vo2DemandFromPower ?? vo2DemandFromPaceGrade;
        const vo2Source = vo2DemandFromPower !== null
          ? 'power'
          : vo2DemandFromPaceGrade !== null
            ? 'pace_grade'
            : null;

        const effortFraction = estimateEffortFraction(activity.heart_rate, restingHr, estimatedMaxHr);
        const estimatedVo2Raw = vo2Demand !== null && effortFraction !== null
          ? vo2Demand / effortFraction
          : null;
        const estimatedVo2 = estimatedVo2Raw !== null ? clamp(estimatedVo2Raw, 20, 90) : null;

        return {
          ...activity,
          estimated_vo2: estimatedVo2,
          vo2_source: vo2Source
        };
      })
      .sort((a: { start_date: string }, b: { start_date: string }) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

    const vo2WithPowerCount = sportActivities.filter((activity) =>
      activity.estimated_vo2 !== null && activity.vo2_source === 'power'
    ).length;
    const vo2WithPaceGradeCount = sportActivities.filter((activity) =>
      activity.estimated_vo2 !== null && activity.vo2_source === 'pace_grade'
    ).length;

    return NextResponse.json({
      activities: sportActivities,
      count: sportActivities.length,
      years: yearsBack,
      vo2Summary: {
        count: vo2WithPowerCount + vo2WithPaceGradeCount,
        powerCount: vo2WithPowerCount,
        paceGradeCount: vo2WithPaceGradeCount
      }
    });
  } catch (error) {
    console.error('Error fetching pace analysis data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pace analysis data' },
      { status: 500 }
    );
  }
}
