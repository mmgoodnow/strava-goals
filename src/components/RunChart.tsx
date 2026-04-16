'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDistance, metersToMiles } from '@/lib/utils';

interface RunChartProps {
  weeklyDistance: Record<number, number>;
  yearlyGoal: number;
}

const millisecondsPerDay = 1000 * 60 * 60 * 24;

type RunTooltipPayload = {
  payload: {
    label: string;
    range: string;
    distance: number;
    distanceMiles: number;
  };
};

const getWeeksInYear = (year: number) => {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const lastDayIndex = Math.floor((yearEnd.getTime() - yearStart.getTime()) / millisecondsPerDay);

  return Math.floor(lastDayIndex / 7) + 1;
};

const formatShortDate = (date: Date) => (
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
);

const formatWeekRange = (year: number, weekIndex: number) => {
  const start = new Date(year, 0, 1 + weekIndex * 7);
  const end = new Date(year, 0, 1 + weekIndex * 7 + 6);
  const yearEnd = new Date(year, 11, 31);

  if (end > yearEnd) {
    end.setTime(yearEnd.getTime());
  }

  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
};

function RunChartTooltip({
  active,
  payload,
  weeklyTargetMeters,
}: { active?: boolean; payload?: RunTooltipPayload[]; weeklyTargetMeters: number }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const tooltipPayload = payload[0]?.payload;
  if (!tooltipPayload) {
    return null;
  }

  const distance = tooltipPayload.distance;
  const difference = distance - weeklyTargetMeters;
  const isOver = difference >= 0;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-lg">{tooltipPayload.label}</p>
      <p className="text-sm text-gray-600">{tooltipPayload.range}</p>
      <p className="text-orange-500 font-medium">{formatDistance(distance)}</p>
      <p className={`text-sm mt-1 ${isOver ? 'text-green-600' : 'text-red-600'}`}>
        {isOver ? '+' : ''}
        {formatDistance(difference)} {isOver ? 'over' : 'under'} target
      </p>
    </div>
  );
}

export default function RunChart({ weeklyDistance, yearlyGoal }: RunChartProps) {
  const year = new Date().getFullYear();
  const weekCount = getWeeksInYear(year);
  const weeklyTargetMeters = yearlyGoal / weekCount;
  const weeklyTargetMiles = metersToMiles(weeklyTargetMeters);
  
  const data = Array.from({ length: weekCount }, (_, index) => {
    const distance = weeklyDistance[index] || 0;

    return {
      label: `W${index + 1}`,
      range: formatWeekRange(year, index),
      distance,
      distanceMiles: metersToMiles(distance),
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Weekly Progress</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label"
              interval={3}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Miles', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip content={<RunChartTooltip weeklyTargetMeters={weeklyTargetMeters} />} />
            <Bar 
              dataKey="distanceMiles" 
              fill="#fb923c"
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine 
              y={weeklyTargetMiles} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: "Weekly Target", position: "right", fill: "#ef4444" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-sm text-gray-600 text-center">
        Weekly target: {weeklyTargetMiles.toFixed(1)} miles
      </div>
    </div>
  );
}
