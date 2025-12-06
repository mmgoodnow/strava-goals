'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDistance } from '@/lib/utils';

interface RunChartProps {
  monthlyDistance: Record<number, number>;
  yearlyGoal: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type RunTooltipPayload = {
  payload: {
    month: string;
    distance: number;
    distanceMiles: number;
  };
};

function RunChartTooltip({
  active,
  payload,
  monthlyTargetMeters,
}: { active?: boolean; payload?: RunTooltipPayload[]; monthlyTargetMeters: number }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const tooltipPayload = payload[0]?.payload;
  if (!tooltipPayload) {
    return null;
  }

  const distance = tooltipPayload.distance;
  const difference = distance - monthlyTargetMeters;
  const isOver = difference >= 0;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-lg">{tooltipPayload.month}</p>
      <p className="text-orange-500 font-medium">{formatDistance(distance)}</p>
      <p className={`text-sm mt-1 ${isOver ? 'text-green-600' : 'text-red-600'}`}>
        {isOver ? '+' : ''}
        {formatDistance(difference)} {isOver ? 'over' : 'under'} target
      </p>
    </div>
  );
}

export default function RunChart({ monthlyDistance, yearlyGoal }: RunChartProps) {
  const monthlyTargetMeters = yearlyGoal / 12;
  const monthlyTargetMiles = monthlyTargetMeters * 0.000621371;
  
  const data = monthNames.map((month, index) => ({
    month,
    distance: monthlyDistance[index] || 0,
    distanceMiles: (monthlyDistance[index] || 0) * 0.000621371,
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Monthly Progress</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Miles', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip content={<RunChartTooltip monthlyTargetMeters={monthlyTargetMeters} />} />
            <Bar 
              dataKey="distanceMiles" 
              fill="#fb923c"
              radius={[8, 8, 0, 0]}
            />
            <ReferenceLine 
              y={monthlyTargetMiles} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: "Monthly Target", position: "right", fill: "#ef4444" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-sm text-gray-600 text-center">
        Monthly target: {monthlyTargetMiles.toFixed(1)} miles
      </div>
    </div>
  );
}
