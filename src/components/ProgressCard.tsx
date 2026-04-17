'use client';

import {
  formatDistance,
  getDaysRemainingInYear,
  getDaysElapsedInYear,
  calculateRequiredPace
} from '@/lib/utils';

interface ProgressCardProps {
  totalDistance: number;
  yearlyGoal: number;
  runCount: number;
}

export default function ProgressCard({ totalDistance, yearlyGoal, runCount }: ProgressCardProps) {
  const progress = (totalDistance / yearlyGoal) * 100;
  const remainingDistance = Math.max(0, yearlyGoal - totalDistance);
  const daysRemaining = getDaysRemainingInYear();
  const daysElapsed = getDaysElapsedInYear();
  const requiredDailyDistance = calculateRequiredPace(remainingDistance, daysRemaining);
  const currentDailyAverage = totalDistance / daysElapsed;

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-foreground-strong mb-4">Yearly Progress</h2>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-4xl font-bold text-orange-500">
            {progress.toFixed(1)}%
          </span>
          <span className="text-foreground-muted">
            {formatDistance(totalDistance)} / {formatDistance(yearlyGoal)}
          </span>
        </div>

        <div className="w-full bg-surface-muted rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-foreground-muted">Runs completed</span>
          <span className="font-semibold">{runCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-foreground-muted">Days remaining</span>
          <span className="font-semibold">{daysRemaining}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-foreground-muted">Current daily average</span>
          <span className="font-semibold">{formatDistance(currentDailyAverage)}/day</span>
        </div>

        {remainingDistance > 0 && (
          <div className="flex justify-between">
            <span className="text-foreground-muted">Required daily pace</span>
            <span className="font-semibold text-orange-500">
              {formatDistance(requiredDailyDistance)}/day
            </span>
          </div>
        )}
      </div>

      {progress >= 100 && (
        <div className="mt-4 p-3 bg-tint-green rounded-lg text-center">
          <span className="text-accent-green font-semibold">
            🎉 Goal achieved! You&apos;ve exceeded your target by {formatDistance(totalDistance - yearlyGoal)}
          </span>
        </div>
      )}
    </div>
  );
}
