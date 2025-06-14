'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Area, ComposedChart, defs, linearGradient, stop } from 'recharts';
import { formatDistance } from '@/lib/utils';

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number;
  start_date: string;
  moving_time: number;
}

interface ProgressLineChartProps {
  activities: Activity[];
  yearlyGoal: number;
}

export default function ProgressLineChart({ activities, yearlyGoal }: ProgressLineChartProps) {
  // Calculate cumulative distance by date
  const sortedActivities = [...activities]
    .filter(a => a.type === 'Run')
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const today = new Date();
  
  // Create daily data points to show continuous target progression
  const data = [];
  let cumulativeDistance = 0;
  let activityIndex = 0;
  
  // Create a map of activities by date for quick lookup
  const activitiesByDate = new Map();
  sortedActivities.forEach(activity => {
    const dateStr = activity.start_date.split('T')[0];
    if (!activitiesByDate.has(dateStr)) {
      activitiesByDate.set(dateStr, []);
    }
    activitiesByDate.get(dateStr).push(activity);
  });
  
  const todayDayOfYear = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const endDayOfYear = Math.min(todayDayOfYear, 365);
  
  // Create data point for each day
  for (let dayOfYear = 0; dayOfYear <= endDayOfYear; dayOfYear++) {
    const currentDate = new Date(yearStart);
    currentDate.setDate(currentDate.getDate() + dayOfYear);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Add any activities that happened on this day
    if (activitiesByDate.has(dateStr)) {
      const dayActivities = activitiesByDate.get(dateStr);
      dayActivities.forEach(activity => {
        cumulativeDistance += activity.distance;
      });
    }
    
    const actualMiles = cumulativeDistance * 0.000621371;
    const targetMiles = (dayOfYear / 365) * yearlyGoal * 0.000621371;
    const diff = actualMiles - targetMiles;
    
    data.push({
      date: currentDate,
      dateStr: dateStr,
      dayOfYear: dayOfYear,
      actual: cumulativeDistance,
      actualMiles: actualMiles,
      targetMiles: targetMiles,
      difference: diff,
      positiveArea: diff >= 0 ? diff : 0,
      negativeArea: diff < 0 ? Math.abs(diff) : 0,
    });
  }
  
  // Add year-end point for target line
  data.push({
    date: yearEnd,
    dateStr: yearEnd.toISOString().split('T')[0],
    dayOfYear: 365,
    actual: null,
    actualMiles: null,
    targetMiles: yearlyGoal * 0.000621371,
    difference: null,
    positiveArea: null,
    negativeArea: null,
  });

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: Date; actual: number; targetMiles: number } }> }) => {
    if (active && payload && payload.length && payload[0].payload.actual !== null) {
      const date = new Date(payload[0].payload.date);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <p className="text-blue-600">
            Actual: {formatDistance(payload[0].payload.actual)}
          </p>
          <p className="text-gray-600">
            Target: {formatDistance(payload[0].payload.targetMiles / 0.000621371)}
          </p>
          <p className={payload[0].payload.actual >= payload[0].payload.targetMiles / 0.000621371 ? 'text-green-600' : 'text-red-600'}>
            {payload[0].payload.actual >= payload[0].payload.targetMiles / 0.000621371 ? 'Ahead by' : 'Behind by'}: {formatDistance(Math.abs(payload[0].payload.actual - payload[0].payload.targetMiles / 0.000621371))}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Create tick values for x-axis (monthly)
  const xAxisTicks = Array.from({length: 12}, (_, i) => {
    const monthDate = new Date(year, i, 1);
    return Math.floor((monthDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Year Progress vs Target</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dayOfYear"
              type="number"
              domain={[0, 365]}
              ticks={xAxisTicks}
              tickFormatter={(value) => {
                const date = new Date(year, 0, 1);
                date.setDate(date.getDate() + value);
                return date.toLocaleDateString('en-US', { month: 'short' });
              }}
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Miles', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="actualMiles" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              name="Actual Progress"
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="targetMiles" 
              stroke="#9ca3af" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target Pace"
            />
            <Area
              type="monotone"
              dataKey="positiveArea"
              stroke="none"
              fill="rgba(16, 185, 129, 0.4)"
              connectNulls={false}
              name="Ahead of Pace"
            />
            <Area
              type="monotone"
              dataKey="negativeArea"
              stroke="none"
              fill="rgba(239, 68, 68, 0.4)"
              connectNulls={false}
              name="Behind Pace"
            />
            <ReferenceLine 
              y={0}
              stroke="#6b7280"
              strokeDasharray="2 2"
              strokeOpacity={0.5}
            />
            <ReferenceLine 
              x={todayDayOfYear} 
              stroke="#ef4444" 
              strokeDasharray="3 3"
              label={{ value: "Today", position: "top" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}