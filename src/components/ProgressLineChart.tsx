'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { formatDistance } from '@/lib/utils';

interface ProgressLineChartProps {
  activities: any[];
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
  
  // Create data points for stair-step visualization
  const data = [];
  let cumulativeDistance = 0;
  
  // Add starting point
  data.push({
    date: yearStart,
    dateStr: yearStart.toISOString().split('T')[0],
    dayOfYear: 0,
    actual: 0,
    actualMiles: 0,
    targetMiles: 0,
  });
  
  // Add a point for each activity
  sortedActivities.forEach((activity, index) => {
    const activityDate = new Date(activity.start_date);
    const dayOfYear = Math.floor((activityDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Add point just before the activity (to create the horizontal line)
    if (index > 0 || dayOfYear > 0) {
      data.push({
        date: activityDate,
        dateStr: activityDate.toISOString().split('T')[0],
        dayOfYear: dayOfYear,
        actual: cumulativeDistance,
        actualMiles: cumulativeDistance * 0.000621371,
        targetMiles: (dayOfYear / 365) * yearlyGoal * 0.000621371,
      });
    }
    
    // Add point after the activity (vertical jump)
    cumulativeDistance += activity.distance;
    data.push({
      date: activityDate,
      dateStr: activityDate.toISOString().split('T')[0],
      dayOfYear: dayOfYear,
      actual: cumulativeDistance,
      actualMiles: cumulativeDistance * 0.000621371,
      targetMiles: (dayOfYear / 365) * yearlyGoal * 0.000621371,
    });
  });
  
  // Add current point (horizontal line to today)
  const todayDayOfYear = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  data.push({
    date: today,
    dateStr: today.toISOString().split('T')[0],
    dayOfYear: todayDayOfYear,
    actual: cumulativeDistance,
    actualMiles: cumulativeDistance * 0.000621371,
    targetMiles: (todayDayOfYear / 365) * yearlyGoal * 0.000621371,
  });
  
  // Add year-end point for target line
  data.push({
    date: yearEnd,
    dateStr: yearEnd.toISOString().split('T')[0],
    dayOfYear: 365,
    actual: null,
    actualMiles: null,
    targetMiles: yearlyGoal * 0.000621371,
  });

  const CustomTooltip = ({ active, payload }: any) => {
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
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              type="stepAfter" 
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
            <ReferenceLine 
              x={todayDayOfYear} 
              stroke="#ef4444" 
              strokeDasharray="3 3"
              label={{ value: "Today", position: "top" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}