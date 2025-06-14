'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PaceActivity, calculateTrendline, formatPaceTime, SportType, SPORT_CONFIG, formatSportMetric, formatSpeed } from '@/lib/utils';

interface PaceAnalysisData {
  activities: PaceActivity[];
  count: number;
  years: number;
}

interface PaceAnalysisChartProps {
  sport: SportType;
}

export default function PaceAnalysisChart({ sport }: PaceAnalysisChartProps) {
  const [data, setData] = useState<PaceAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearsBack, setYearsBack] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<'pace' | 'distance'>('pace');
  
  const sportConfig = SPORT_CONFIG[sport];

  useEffect(() => {
    fetchPaceData();
  }, [yearsBack, sport]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/strava/pace-analysis?years=${yearsBack}&sport=${sport}`);
      
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

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
        {viewMode === 'pace' 
          ? (sport === 'Run' ? 'Pace Analysis' : 'Speed Analysis')
          : 'Distance Analysis'
        }
      </h2>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* View mode selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pace')}
            className={`px-3 py-2 rounded-lg font-medium transition ${
              viewMode === 'pace'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {sport === 'Run' ? 'Pace' : 'Speed'}
          </button>
          <button
            onClick={() => setViewMode('distance')}
            className={`px-3 py-2 rounded-lg font-medium transition ${
              viewMode === 'distance'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Distance
          </button>
        </div>
        
        {/* Years selector */}
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
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="text-center py-8">
          <p className="text-gray-600">No {sportConfig.name.toLowerCase()} data available for analysis</p>
          <p className="text-sm text-gray-500 mt-2">Try selecting a different time period above</p>
        </div>
      </div>
    );
  }

  // Prepare individual activity data for scatter plot
  const chartData = data.activities.map((activity) => {
    const date = new Date(activity.start_date);
    const distanceMiles = activity.distance * 0.000621371;
    
    // For cycling, convert pace to speed
    let speedValue = activity.pace;
    if (sport === 'Ride' && activity.pace > 0) {
      // Convert pace (min/mile) to speed (mph)
      speedValue = 60 / activity.pace;
    }
    
    return {
      x: date.getTime(), // Use timestamp for proper date spacing
      y: viewMode === 'pace' ? (sport === 'Run' ? activity.pace : speedValue) : distanceMiles,
      date: date.toLocaleDateString(),
      name: activity.name,
      distance: activity.distance,
      distanceMiles: distanceMiles,
      pace: activity.pace,
      speed: speedValue,
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
  // For trendline calculation, we need to map timestamps to indices for the linear regression
  const sortedData = [...chartData].sort((a, b) => a.x - b.x);
  const chartDataWithTrend = sortedData.map((point, index) => ({
    ...point,
    trendY: trendline.slope * index + trendline.intercept
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { 
    date: string; 
    name: string; 
    y: number;
    pace: number;
    speed: number;
    distanceMiles: number;
    distance: number; 
    moving_time: number; 
    year: number 
  } }> }) => {
    if (active && payload && payload.length) {
      const activityData = payload[0].payload;
      const durationMinutes = Math.floor(activityData.moving_time / 60);
      const durationSeconds = activityData.moving_time % 60;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{activityData.name}</p>
          {viewMode === 'pace' ? (
            <p className="text-blue-600 text-lg font-bold">
              {sport === 'Run' 
                ? `${formatPaceTime(activityData.pace)}/mi`
                : `${activityData.speed.toFixed(1)} mph`
              }
            </p>
          ) : (
            <p className="text-blue-600 text-lg font-bold">
              {activityData.distanceMiles.toFixed(2)} miles
            </p>
          )}
          <p className="text-gray-600 text-sm">
            {viewMode === 'pace' 
              ? `${activityData.distanceMiles.toFixed(2)} miles • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
              : sport === 'Run'
                ? `${formatPaceTime(activityData.pace)}/mi • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
                : `${activityData.speed.toFixed(1)} mph • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
            }
          </p>
          <p className="text-gray-500 text-sm">
            {activityData.date}
          </p>
        </div>
      );
    }
    return null;
  };


  // Calculate trend direction
  const trendDirection = viewMode === 'pace' 
    ? (sport === 'Run' 
        ? (trendline.slope < 0 ? 'improving' : 'declining')  // For running, lower pace is better
        : (trendline.slope > 0 ? 'improving' : 'declining')  // For cycling, higher speed is better
      )
    : (trendline.slope > 0 ? 'increasing' : 'decreasing');
  const trendMagnitude = Math.abs(trendline.slope);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {renderHeader()}

      <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Total {sport === 'Run' ? 'runs' : 'rides'}: {data.count}</span>
        <span className={`font-medium ${
          (viewMode === 'pace' && trendDirection === 'improving') || 
          (viewMode === 'distance' && trendDirection === 'increasing') 
            ? 'text-green-600' : 'text-red-600'
        }`}>
          Trend: {trendDirection} {trendMagnitude > 0.01 ? 
            viewMode === 'pace' 
              ? (sport === 'Run' 
                  ? `(${formatPaceTime(trendMagnitude)}/mi per run)`
                  : `(${trendMagnitude.toFixed(1)} mph per ride)`
                )
              : `(${trendMagnitude.toFixed(2)} mi per ${sport === 'Run' ? 'run' : 'ride'})`
            : '(minimal change)'
          }
        </span>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartDataWithTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="x"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ 
                value: viewMode === 'pace' 
                  ? (sport === 'Run' ? 'Pace (min/mile)' : 'Speed (mph)') 
                  : 'Distance (miles)', 
                angle: -90, 
                position: 'insideLeft', 
                fill: '#6b7280' 
              }}
              tickFormatter={(value) => 
                viewMode === 'pace' 
                  ? (sport === 'Run' ? formatPaceTime(value) : `${value.toFixed(1)}`)
                  : `${value.toFixed(1)}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Individual run points */}
            <Scatter 
              dataKey="y" 
              fill="#3b82f6"
              name={viewMode === 'pace' 
                ? (sport === 'Run' ? 'Run Pace' : 'Ride Speed') 
                : `${sportConfig.name} Distance`
              }
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