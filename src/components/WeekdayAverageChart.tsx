'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistance } from '@/lib/utils';

interface Activity {
  id: string;
  distance: number;
  start_date: string;
}

interface WeekdayAverageChartProps {
  activities: Activity[];
}

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type WeekdayTooltipPayload = {
  payload: {
    weekday: string;
    averageDistance: number;
    averageMiles: number;
    runCount: number;
    weekdayCount: number;
  };
};

function WeekdayChartTooltip({
  active,
  payload,
}: { active?: boolean; payload?: WeekdayTooltipPayload[] }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const tooltipPayload = payload[0]?.payload;
  if (!tooltipPayload) {
    return null;
  }

  return (
    <div className="bg-surface text-foreground p-3 border border-border rounded-lg shadow-lg">
      <p className="font-semibold text-lg">{tooltipPayload.weekday}</p>
      <p className="text-orange-500 font-medium">{formatDistance(tooltipPayload.averageDistance)} avg</p>
      <p className="text-sm mt-1 text-foreground-muted">
        Based on {tooltipPayload.weekdayCount} calendar days ({tooltipPayload.runCount} activities)
      </p>
    </div>
  );
}

export default function WeekdayAverageChart({ activities }: WeekdayAverageChartProps) {
  const weekdayTotals = Array.from({ length: 7 }, () => ({ totalDistance: 0, runCount: 0 }));
  const weekdayCounts = Array.from({ length: 7 }, () => 0);

  activities.forEach((activity) => {
    const weekday = new Date(activity.start_date).getDay();
    weekdayTotals[weekday].totalDistance += activity.distance;
    weekdayTotals[weekday].runCount += 1;
  });

  if (activities.length > 0) {
    const activityDates = activities.map((activity) => new Date(activity.start_date));
    const firstDate = new Date(Math.min(...activityDates.map((date) => date.getTime())));
    const lastDate = new Date(Math.max(...activityDates.map((date) => date.getTime())));

    firstDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    const cursor = new Date(firstDate);
    while (cursor <= lastDate) {
      weekdayCounts[cursor.getDay()] += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const data = weekdayNames.map((weekday, index) => {
    const totals = weekdayTotals[index];
    const weekdayCount = weekdayCounts[index];
    const averageDistance = weekdayCount ? totals.totalDistance / weekdayCount : 0;

    return {
      weekday,
      averageDistance,
      averageMiles: averageDistance * 0.000621371,
      runCount: totals.runCount,
      weekdayCount,
    };
  });

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-foreground-strong mb-4">Average Miles by Weekday</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
            <XAxis
              dataKey="weekday"
              tick={{ fill: 'var(--color-chart-tick)' }}
              axisLine={{ stroke: 'var(--color-chart-axis)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-chart-tick)' }}
              axisLine={{ stroke: 'var(--color-chart-axis)' }}
              label={{ value: 'Miles', angle: -90, position: 'insideLeft', fill: 'var(--color-chart-tick)' }}
            />
            <Tooltip content={<WeekdayChartTooltip />} />
            <Bar
              dataKey="averageMiles"
              fill="#fdba74"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-sm text-foreground-muted text-center">
        Average distance per calendar weekday across the selected date range
      </div>
    </div>
  );
}
