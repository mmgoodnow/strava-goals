export const getYearStartTimestamp = () => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return Math.floor(yearStart.getTime() / 1000);
};

export const getYearEndTimestamp = () => {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return Math.floor(yearEnd.getTime() / 1000);
};

export const getDaysRemainingInYear = () => {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const diffTime = yearEnd.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDaysElapsedInYear = () => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const diffTime = now.getTime() - yearStart.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const metersToMiles = (meters: number) => {
  return meters * 0.000621371;
};

export const metersToKilometers = (meters: number) => {
  return meters / 1000;
};

export const formatDistance = (meters: number, unit: 'mi' | 'km' = 'mi') => {
  if (unit === 'mi') {
    return `${metersToMiles(meters).toFixed(2)} mi`;
  }
  return `${metersToKilometers(meters).toFixed(2)} km`;
};

export const calculateRequiredPace = (remainingDistance: number, daysRemaining: number) => {
  if (daysRemaining <= 0) return 0;
  return remainingDistance / daysRemaining;
};

// Sport configuration
export type SportType = 'Run' | 'Ride';

export interface SportConfig {
  name: string;
  icon: string;
  unit: 'pace' | 'speed';
  goalRanges: number[];
}

export const SPORT_CONFIG: Record<SportType, SportConfig> = {
  Run: {
    name: 'Running',
    icon: '🏃',
    unit: 'pace',
    goalRanges: [200, 250, 300, 365, 400, 500, 750, 1000]
  },
  Ride: {
    name: 'Cycling', 
    icon: '🚴',
    unit: 'speed',
    goalRanges: [1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000]
  }
};

export const formatPace = (metersPerSecond: number, unit: 'mi' | 'km' = 'mi') => {
  if (metersPerSecond === 0) return '0:00';
  
  const secondsPerUnit = unit === 'mi' 
    ? 1609.34 / metersPerSecond 
    : 1000 / metersPerSecond;
  
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.floor(secondsPerUnit % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatSpeed = (metersPerSecond: number, unit: 'mi' | 'km' = 'mi') => {
  if (metersPerSecond === 0) return '0.0';
  
  const speed = unit === 'mi' 
    ? (metersPerSecond * 3600) / 1609.34 // mph
    : (metersPerSecond * 3600) / 1000; // kph
  
  return speed.toFixed(1);
};

export const formatSportMetric = (metersPerSecond: number, sport: SportType, unit: 'mi' | 'km' = 'mi') => {
  const config = SPORT_CONFIG[sport];
  if (config.unit === 'pace') {
    return formatPace(metersPerSecond, unit);
  } else {
    return formatSpeed(metersPerSecond, unit);
  }
};

export const getWeeksRemainingInYear = () => {
  const daysRemaining = getDaysRemainingInYear();
  return Math.ceil(daysRemaining / 7);
};

export const getExpectedProgressToDate = (yearlyGoal: number) => {
  const daysElapsed = getDaysElapsedInYear();
  const totalDaysInYear = 365; // Simplification, could check for leap year
  return (daysElapsed / totalDaysInYear) * yearlyGoal;
};

export const getProgressDifference = (actualDistance: number, yearlyGoal: number) => {
  const expectedDistance = getExpectedProgressToDate(yearlyGoal);
  return actualDistance - expectedDistance; // Positive if ahead, negative if behind
};

export const calculateWeeklyDistanceToGoal = (remainingDistance: number, weeksRemaining: number) => {
  if (weeksRemaining <= 0) return 0;
  return remainingDistance / weeksRemaining;
};

export const calculateWeeklyDistanceToCatchUp = (
  currentDistance: number, 
  yearlyGoal: number, 
  weeksToTarget: number
) => {
  const progressDiff = getProgressDifference(currentDistance, yearlyGoal);
  const weeksRemaining = getWeeksRemainingInYear();
  
  if (progressDiff >= 0) {
    // Already on pace or ahead
    return calculateWeeklyDistanceToGoal(yearlyGoal - currentDistance, weeksRemaining);
  }
  
  if (weeksRemaining <= weeksToTarget) {
    // Not enough time to catch up gradually
    return calculateWeeklyDistanceToGoal(yearlyGoal - currentDistance, weeksRemaining);
  }
  
  // Calculate what we need to run to be on pace after weeksToTarget
  const daysToTarget = weeksToTarget * 7;
  const currentDayOfYear = getDaysElapsedInYear();
  const targetDayOfYear = currentDayOfYear + daysToTarget;
  const expectedDistanceAtTarget = (targetDayOfYear / 365) * yearlyGoal;
  
  // Distance needed to reach the expected point
  const distanceToMakeUp = expectedDistanceAtTarget - currentDistance;
  
  // Weekly amount to make up the deficit
  return distanceToMakeUp / weeksToTarget;
};

// Pace analysis utilities
export interface PaceActivity {
  id: string;
  name: string;
  distance: number;
  moving_time: number;
  start_date: string;
  pace: number;
}

export interface AggregatedPaceData {
  period: string;
  date: Date;
  averagePace: number;
  runCount: number;
  year: number;
}

export const aggregatePaceData = (
  activities: PaceActivity[], 
  period: 'weekly' | 'monthly' | 'quarterly'
): AggregatedPaceData[] => {
  const grouped = new Map<string, PaceActivity[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.start_date);
    let key: string;
    
    switch (period) {
      case 'weekly':
        // Get the Monday of the week
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        key = `${monday.getFullYear()}-W${getWeekNumber(monday)}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(activity);
  });
  
  return Array.from(grouped.entries()).map(([period, acts]) => {
    const totalPace = acts.reduce((sum, act) => sum + act.pace, 0);
    const averagePace = totalPace / acts.length;
    const sampleDate = new Date(acts[0].start_date);
    
    return {
      period,
      date: sampleDate,
      averagePace,
      runCount: acts.length,
      year: sampleDate.getFullYear()
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const calculateTrendline = (data: AggregatedPaceData[]) => {
  if (data.length < 2) return { slope: 0, intercept: 0 };
  
  const n = data.length;
  const sumX = data.reduce((sum, point, index) => sum + index, 0);
  const sumY = data.reduce((sum, point) => sum + point.averagePace, 0);
  const sumXY = data.reduce((sum, point, index) => sum + index * point.averagePace, 0);
  const sumXX = data.reduce((sum, point, index) => sum + index * index, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const formatPaceTime = (pace: number): string => {
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Multi-year pace analysis utilities
export const convertPaceToMinutesPerMile = (secondsPerMeter: number) => {
  if (secondsPerMeter === 0) return 0;
  return (secondsPerMeter * 1609.34) / 60; // Convert to minutes per mile
};

export const convertPaceToMinutesPerKm = (secondsPerMeter: number) => {
  if (secondsPerMeter === 0) return 0;
  return (secondsPerMeter * 1000) / 60; // Convert to minutes per km
};

export const formatPaceMinutes = (minutesPerUnit: number, unit: 'mi' | 'km' = 'mi') => {
  if (minutesPerUnit === 0) return '0:00';
  
  const minutes = Math.floor(minutesPerUnit);
  const seconds = Math.round((minutesPerUnit - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit}`;
};

export const calculatePaceImprovement = (oldPace: number, newPace: number) => {
  if (oldPace === 0 || newPace === 0) return 0;
  return ((oldPace - newPace) / oldPace) * 100; // Positive means improvement (faster)
};

export const getDistanceRangeLabel = (range: string) => {
  const labels: Record<string, string> = {
    short: 'Short Runs (< 5K)',
    medium: 'Medium Runs (5K-10K)',
    long: 'Long Runs (10K-Half)',
    ultraLong: 'Ultra Long (Half+)',
  };
  return labels[range] || range;
};

export const calculateYearOverYearTrend = (yearlyData: Array<{ year: number; averagePace: number }>) => {
  if (yearlyData.length < 2) return null;
  
  // Sort by year
  const sortedData = [...yearlyData].sort((a, b) => a.year - b.year);
  
  // Calculate linear regression for trend
  const n = sortedData.length;
  const sumX = sortedData.reduce((sum, data) => sum + data.year, 0);
  const sumY = sortedData.reduce((sum, data) => sum + data.averagePace, 0);
  const sumXY = sortedData.reduce((sum, data) => sum + (data.year * data.averagePace), 0);
  const sumXX = sortedData.reduce((sum, data) => sum + (data.year * data.year), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept, isImproving: slope < 0 }; // Negative slope means pace is getting faster (improving)
};

export const findBestAndWorstYears = (yearlyData: Array<{ year: number; averagePace: number }>) => {
  if (yearlyData.length === 0) return { best: null, worst: null };
  
  const validData = yearlyData.filter(data => data.averagePace > 0);
  if (validData.length === 0) return { best: null, worst: null };
  
  const best = validData.reduce((best, current) => 
    current.averagePace < best.averagePace ? current : best
  );
  
  const worst = validData.reduce((worst, current) => 
    current.averagePace > worst.averagePace ? current : worst
  );
  
  return { best, worst };
};
