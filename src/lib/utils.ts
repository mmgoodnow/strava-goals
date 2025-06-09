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

export const formatPace = (metersPerSecond: number, unit: 'mi' | 'km' = 'mi') => {
  if (metersPerSecond === 0) return '0:00';
  
  const secondsPerUnit = unit === 'mi' 
    ? 1609.34 / metersPerSecond 
    : 1000 / metersPerSecond;
  
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.floor(secondsPerUnit % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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