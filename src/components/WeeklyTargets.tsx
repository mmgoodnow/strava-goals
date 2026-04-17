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

  const weeklyToFinish = calculateWeeklyDistanceToGoal(remainingDistance, weeksRemaining);
  const weeklyFor1Month = calculateWeeklyDistanceToCatchUp(totalDistance, yearlyGoal, 4);
  const weeklyFor3Months = calculateWeeklyDistanceToCatchUp(totalDistance, yearlyGoal, 13);

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-foreground-strong mb-4">Weekly Targets</h2>

      <div className="mb-6">
        <div className={`text-lg font-semibold mb-2 ${isAhead ? 'text-accent-green' : 'text-accent-red'}`}>
          {isAhead ? '✓ Ahead of pace by' : '⚠ Behind pace by'} {formatDistance(Math.abs(progressDiff))}
        </div>
        <div className="text-foreground-muted">
          {weeksRemaining} weeks remaining in the year
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex justify-between items-baseline">
            <span className="text-foreground">To reach goal by Dec 31</span>
            <span className="text-xl font-bold text-accent-orange">
              {formatDistance(weeklyToFinish)}/week
            </span>
          </div>
          <div className="text-sm text-foreground-subtle mt-1">
            {formatDistance(weeklyToFinish / 7)}/day average
          </div>
        </div>

        {!isAhead && (
          <>
            <div className="border-b border-border pb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-foreground">To get on pace in 1 month</span>
                <span className="text-xl font-bold text-accent-blue">
                  {formatDistance(weeklyFor1Month)}/week
                </span>
              </div>
              <div className="text-sm text-foreground-subtle mt-1">
                {formatDistance(weeklyFor1Month / 7)}/day average
              </div>
            </div>

            <div className="pb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-foreground">To get on pace in 3 months</span>
                <span className="text-xl font-bold text-accent-purple">
                  {formatDistance(weeklyFor3Months)}/week
                </span>
              </div>
              <div className="text-sm text-foreground-subtle mt-1">
                {formatDistance(weeklyFor3Months / 7)}/day average
              </div>
            </div>
          </>
        )}

        {isAhead && (
          <div className="mt-4 p-3 bg-tint-green-soft rounded-lg">
            <p className="text-accent-green text-sm">
              Great job! You&apos;re ahead of schedule. Maintain {formatDistance(weeklyToFinish)}/week to comfortably reach your goal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
