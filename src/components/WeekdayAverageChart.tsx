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
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-lg">{tooltipPayload.weekday}</p>
      <p className="text-orange-500 font-medium">{formatDistance(tooltipPayload.averageDistance)} avg</p>
      <p className="text-sm mt-1 text-gray-600">Based on {tooltipPayload.runCount} activities</p>
    </div>
  );
}

export default function WeekdayAverageChart({ activities }: WeekdayAverageChartProps) {
  const weekdayTotals = Array.from({ length: 7 }, () => ({ totalDistance: 0, runCount: 0 }));

  activities.forEach((activity) => {
    const weekday = new Date(activity.start_date).getDay();
    weekdayTotals[weekday].totalDistance += activity.distance;
    weekdayTotals[weekday].runCount += 1;
  });

  const data = weekdayNames.map((weekday, index) => {
    const totals = weekdayTotals[index];
    const averageDistance = totals.runCount ? totals.totalDistance / totals.runCount : 0;

    return {
      weekday,
      averageDistance,
      averageMiles: averageDistance * 0.000621371,
      runCount: totals.runCount,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Average Miles by Weekday</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="weekday"
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Miles', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
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
      <div className="mt-2 text-sm text-gray-600 text-center">
        Average distance per activity for each weekday
      </div>
    </div>
  );
}
