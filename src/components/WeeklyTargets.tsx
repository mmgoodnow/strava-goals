'use client';

import { 
  formatDistance, 
  getWeeksRemainingInYear,
  getProgressDifference,
  calculateWeeklyDistanceToGoal,
  calculateWeeklyDistanceToCatchUp
} from '@/lib/utils';

interface WeeklyTargetsProps {
  totalDistance: number;
  yearlyGoal: number;
}

export default function WeeklyTargets({ totalDistance, yearlyGoal }: WeeklyTargetsProps) {
  const remainingDistance = Math.max(0, yearlyGoal - totalDistance);
  const weeksRemaining = getWeeksRemainingInYear();
  const progressDiff = getProgressDifference(totalDistance, yearlyGoal);
  const isAhead = progressDiff >= 0;
  
  // Calculate weekly targets
  const weeklyToFinish = calculateWeeklyDistanceToGoal(remainingDistance, weeksRemaining);
  const weeklyFor1Month = calculateWeeklyDistanceToCatchUp(totalDistance, yearlyGoal, 4);
  const weeklyFor3Months = calculateWeeklyDistanceToCatchUp(totalDistance, yearlyGoal, 13);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Weekly Targets</h2>
      
      <div className="mb-6">
        <div className={`text-lg font-semibold mb-2 ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
          {isAhead ? '✓ Ahead of pace by' : '⚠ Behind pace by'} {formatDistance(Math.abs(progressDiff))}
        </div>
        <div className="text-gray-600">
          {weeksRemaining} weeks remaining in the year
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b pb-3">
          <div className="flex justify-between items-baseline">
            <span className="text-gray-700">To reach goal by Dec 31</span>
            <span className="text-xl font-bold text-orange-600">
              {formatDistance(weeklyToFinish)}/week
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {formatDistance(weeklyToFinish / 7)}/day average
          </div>
        </div>

        {!isAhead && (
          <>
            <div className="border-b pb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-700">To get on pace in 1 month</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatDistance(weeklyFor1Month)}/week
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDistance(weeklyFor1Month / 7)}/day average
              </div>
            </div>

            <div className="pb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-700">To get on pace in 3 months</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatDistance(weeklyFor3Months)}/week
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDistance(weeklyFor3Months / 7)}/day average
              </div>
            </div>
          </>
        )}

        {isAhead && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm">
              Great job! You&apos;re ahead of schedule. Maintain {formatDistance(weeklyToFinish)}/week to comfortably reach your goal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}