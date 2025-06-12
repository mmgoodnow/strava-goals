'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PaceActivity, calculateTrendline, formatPaceTime } from '@/lib/utils';

interface PaceAnalysisData {
  activities: PaceActivity[];
  count: number;
  years: number;
}

export default function PaceAnalysisChart() {
  const [data, setData] = useState<PaceAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearsBack, setYearsBack] = useState<1 | 2 | 3>(3);

  useEffect(() => {
    fetchPaceData();
  }, [yearsBack]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/strava/pace-analysis?years=${yearsBack}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please authenticate with Strava first');
          return;
        }
        throw new Error('Failed to fetch pace data');
      }

      const paceData = await response.json();
      setData(paceData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pace Analysis</h2>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pace Analysis</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">No running data available for analysis</p>
        </div>
      </div>
    );
  }

  // Prepare individual run data for scatter plot
  const chartData = data.activities.map((activity, index) => {
    const date = new Date(activity.start_date);
    return {
      x: index,
      y: activity.pace,
      date: date.toLocaleDateString(),
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
      year: date.getFullYear(),
      fullDate: date
    };
  });

  // Calculate trendline for individual runs
  const trendlineData = chartData.map((point) => ({ averagePace: point.y, date: point.fullDate }));
  const trendline = calculateTrendline(trendlineData.map((d) => ({ 
    period: '', 
    date: d.date, 
    averagePace: d.averagePace, 
    runCount: 1, 
    year: d.date.getFullYear() 
  })));

  // Add trendline values to chart data
  const chartDataWithTrend = chartData.map((point, index) => ({
    ...point,
    trendY: trendline.slope * index + trendline.intercept
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { 
    date: string; 
    name: string; 
    y: number; 
    distance: number; 
    moving_time: number; 
    year: number 
  } }> }) => {
    if (active && payload && payload.length) {
      const runData = payload[0].payload;
      const distanceMiles = (runData.distance * 0.000621371).toFixed(2);
      const durationMinutes = Math.floor(runData.moving_time / 60);
      const durationSeconds = runData.moving_time % 60;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{runData.name}</p>
          <p className="text-blue-600 text-lg font-bold">
            {formatPaceTime(runData.y)}/mi
          </p>
          <p className="text-gray-600 text-sm">
            {distanceMiles} miles • {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
          </p>
          <p className="text-gray-500 text-sm">
            {runData.date}
          </p>
        </div>
      );
    }
    return null;
  };


  // Calculate trend direction
  const trendDirection = trendline.slope < 0 ? 'improving' : 'declining';
  const trendMagnitude = Math.abs(trendline.slope);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Pace Analysis</h2>
        
        <div className="flex gap-2">
          {[1, 2, 3].map((years) => (
            <button
              key={years}
              onClick={() => setYearsBack(years as 1 | 2 | 3)}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                yearsBack === years
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {years} Year{years > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Total runs: {data.count}</span>
        <span className={`font-medium ${trendDirection === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
          Trend: {trendDirection} {trendMagnitude > 0.01 ? `(${formatPaceTime(trendMagnitude)}/mi per run)` : '(minimal change)'}
        </span>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartDataWithTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: '#e5e7eb' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Pace (min/mile)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              tickFormatter={(value) => formatPaceTime(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Individual run points */}
            <Scatter 
              dataKey="y" 
              fill="#3b82f6"
              name="Run Pace"
            />
            
            {/* Trend line */}
            <Line 
              type="monotone" 
              dataKey="trendY" 
              stroke="#ef4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Trend"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}