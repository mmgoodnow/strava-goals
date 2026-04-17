'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PaceActivity, calculateTrendline, formatPaceTime, SportType, SPORT_CONFIG } from '@/lib/utils';

interface PaceAnalysisData {
  activities: PaceActivity[];
  count: number;
  years: number;
  vo2Summary?: {
    count: number;
    powerCount: number;
    paceGradeCount: number;
  };
}

interface PaceAnalysisChartProps {
  sport: SportType;
}

export default function PaceAnalysisChart({ sport }: PaceAnalysisChartProps) {
  const [data, setData] = useState<PaceAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearsBack, setYearsBack] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<'pace' | 'distance' | 'heartRate' | 'vo2'>('pace');
  
  const sportConfig = SPORT_CONFIG[sport];
  const isVo2ModeAvailable = sport === 'Run';

  useEffect(() => {
    fetchPaceData();
  }, [yearsBack, sport]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isVo2ModeAvailable && viewMode === 'vo2') {
      setViewMode('pace');
    }
  }, [isVo2ModeAvailable, viewMode]);

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
      <h2 className="text-2xl font-bold text-foreground-strong mb-4 sm:mb-0">
        {viewMode === 'pace'
          ? (sport === 'Run' ? 'Pace Analysis' : 'Speed Analysis')
          : viewMode === 'distance'
            ? 'Distance Analysis'
            : viewMode === 'heartRate'
              ? 'Heart Rate Analysis'
              : 'Estimated VO2max (Proxy)'
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
                : 'bg-surface-muted text-foreground hover:bg-surface-hover'
            }`}
          >
            {sport === 'Run' ? 'Pace' : 'Speed'}
          </button>
          <button
            onClick={() => setViewMode('distance')}
            className={`px-3 py-2 rounded-lg font-medium transition ${
              viewMode === 'distance'
                ? 'bg-blue-500 text-white'
                : 'bg-surface-muted text-foreground hover:bg-surface-hover'
            }`}
          >
            Distance
          </button>
          <button
            onClick={() => setViewMode('heartRate')}
            className={`px-3 py-2 rounded-lg font-medium transition ${
              viewMode === 'heartRate'
                ? 'bg-blue-500 text-white'
                : 'bg-surface-muted text-foreground hover:bg-surface-hover'
            }`}
          >
            Heart Rate
          </button>
          {isVo2ModeAvailable && (
            <button
              onClick={() => setViewMode('vo2')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                viewMode === 'vo2'
                  ? 'bg-blue-500 text-white'
                  : 'bg-surface-muted text-foreground hover:bg-surface-hover'
              }`}
            >
              VO2 Est.
            </button>
          )}
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
                  : 'bg-surface-muted text-foreground hover:bg-surface-hover'
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
      <div className="bg-surface rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="text-center py-8">
          <p className="text-accent-red">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="text-center py-8">
          <p className="text-foreground-muted">No {sportConfig.name.toLowerCase()} data available for analysis</p>
          <p className="text-sm text-foreground-subtle mt-2">Try selecting a different time period above</p>
        </div>
      </div>
    );
  }

  // Prepare individual activity data for scatter plot
  const rawChartData = data.activities.map((activity) => {
    const date = new Date(activity.start_date);
    const distanceMiles = activity.distance * 0.000621371;
    
    // For cycling, convert pace to speed
    let speedValue = activity.pace;
    if (sport === 'Ride' && activity.pace > 0) {
      // Convert pace (min/mile) to speed (mph)
      speedValue = 60 / activity.pace;
    }

    const heartRate = activity.heart_rate ?? null;
    const estimatedVo2 = activity.estimated_vo2 ?? null;
    const vo2Source = activity.vo2_source ?? null;
    const yValue = viewMode === 'pace'
      ? (sport === 'Run' ? activity.pace : speedValue)
      : viewMode === 'distance'
        ? distanceMiles
        : viewMode === 'heartRate'
          ? heartRate
          : estimatedVo2;
    
    return {
      x: date.getTime(), // Use timestamp for proper date spacing
      y: typeof yValue === 'number' && yValue > 0 ? yValue : null,
      date: date.toLocaleDateString(),
      name: activity.name,
      distance: activity.distance,
      distanceMiles: distanceMiles,
      pace: activity.pace,
      speed: speedValue,
      heartRate,
      estimatedVo2,
      vo2Source,
      moving_time: activity.moving_time,
      year: date.getFullYear(),
      fullDate: date
    };
  });

  const chartData = rawChartData.filter((point) => point.y !== null) as Array<(typeof rawChartData)[number] & { y: number }>;
  const vo2PowerCountFromChart = chartData.filter((point) => point.vo2Source === 'power').length;
  const vo2PaceGradeCountFromChart = chartData.filter((point) => point.vo2Source === 'pace_grade').length;

  if (chartData.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-lg p-6">
        {renderHeader()}
        <div className="text-center py-8">
          <p className="text-foreground-muted">
            {viewMode === 'heartRate'
              ? `No heart rate data available for ${sportConfig.name.toLowerCase()} activities in this period`
              : viewMode === 'vo2'
                ? `No estimated VO2 data available for ${sportConfig.name.toLowerCase()} activities in this period`
                : `No ${sportConfig.name.toLowerCase()} data available for this view`
            }
          </p>
          <p className="text-sm text-foreground-subtle mt-2">Try selecting a different time period above</p>
        </div>
      </div>
    );
  }

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
  const hasTrendline = sortedData.length > 1;
  const chartDataWithTrend = sortedData.map((point, index) => ({
    ...point,
    trendY: hasTrendline ? (trendline.slope * index + trendline.intercept) : point.y
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { 
    date: string; 
    name: string; 
    y: number;
    pace: number;
    speed: number;
    heartRate: number | null;
    estimatedVo2: number | null;
    vo2Source: 'power' | 'pace_grade' | null;
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
        <div className="bg-surface text-foreground p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{activityData.name}</p>
          {viewMode === 'pace' ? (
            <p className="text-accent-blue text-lg font-bold">
              {sport === 'Run' 
                ? `${formatPaceTime(activityData.pace)}/mi`
                : `${activityData.speed.toFixed(1)} mph`
              }
            </p>
          ) : viewMode === 'distance' ? (
            <p className="text-accent-blue text-lg font-bold">
              {activityData.distanceMiles.toFixed(2)} miles
            </p>
          ) : (
            <p className="text-accent-blue text-lg font-bold">
              {viewMode === 'heartRate'
                ? (activityData.heartRate ? `${activityData.heartRate.toFixed(0)} bpm` : 'N/A')
                : (activityData.estimatedVo2 ? `${activityData.estimatedVo2.toFixed(1)} ml/kg/min` : 'N/A')
              }
            </p>
          )}
          <p className="text-foreground-muted text-sm">
            {viewMode === 'pace'
              ? `${activityData.distanceMiles.toFixed(2)} miles • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
              : viewMode === 'distance'
                ? sport === 'Run'
                  ? `${formatPaceTime(activityData.pace)}/mi • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
                  : `${activityData.speed.toFixed(1)} mph • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
                : viewMode === 'heartRate'
                  ? `${activityData.distanceMiles.toFixed(2)} miles • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
                  : `${activityData.distanceMiles.toFixed(2)} miles • ${
                      activityData.vo2Source === 'power'
                        ? 'Power-based'
                        : activityData.vo2Source === 'pace_grade'
                          ? 'Pace+Grade-based'
                          : 'Proxy-based'
                    }`
            }
          </p>
          <p className="text-foreground-subtle text-sm">
            {activityData.date}
          </p>
        </div>
      );
    }
    return null;
  };


  // Calculate trend direction
  const trendMagnitude = Math.abs(trendline.slope);
  const hasMeaningfulTrend = trendMagnitude > (viewMode === 'vo2' ? 0.05 : 0.01);
  const trendDirection = !hasMeaningfulTrend
    ? 'stable'
    : viewMode === 'pace'
      ? (sport === 'Run'
          ? (trendline.slope < 0 ? 'improving' : 'declining')  // For running, lower pace is better
          : (trendline.slope > 0 ? 'improving' : 'declining')  // For cycling, higher speed is better
        )
      : viewMode === 'vo2'
        ? (trendline.slope > 0 ? 'improving' : 'declining')
        : (trendline.slope > 0 ? 'increasing' : 'decreasing');
  const trendColorClass = !hasMeaningfulTrend
    ? 'text-foreground-muted'
    : (viewMode === 'pace' && trendDirection === 'improving') ||
      (viewMode === 'distance' && trendDirection === 'increasing') ||
      (viewMode === 'vo2' && trendDirection === 'improving')
      ? 'text-accent-green'
      : viewMode === 'heartRate'
        ? 'text-accent-blue'
        : 'text-accent-red';

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      {renderHeader()}

      <div className="mb-4 flex flex-wrap gap-4 text-sm text-foreground-muted">
        <span>Total {sport === 'Run' ? 'runs' : 'rides'}: {data.count}</span>
        {viewMode === 'heartRate' && (
          <span>With heart rate data: {chartData.length}</span>
        )}
        {viewMode === 'vo2' && (
          <>
            <span>With VO2 estimates: {data.vo2Summary?.count ?? chartData.length}</span>
            <span>
              Sources: {data.vo2Summary?.powerCount ?? vo2PowerCountFromChart} power, {data.vo2Summary?.paceGradeCount ?? vo2PaceGradeCountFromChart} pace+grade
            </span>
          </>
        )}
        <span className={`font-medium ${trendColorClass}`}>
          Trend: {trendDirection} {hasMeaningfulTrend ? 
            viewMode === 'pace' 
              ? (sport === 'Run' 
                  ? `(${formatPaceTime(trendMagnitude)}/mi per run)`
                  : `(${trendMagnitude.toFixed(1)} mph per ride)`
                )
              : viewMode === 'distance'
                ? `(${trendMagnitude.toFixed(2)} mi per ${sport === 'Run' ? 'run' : 'ride'})`
                : viewMode === 'heartRate'
                  ? `(${trendMagnitude.toFixed(1)} bpm per ${sport === 'Run' ? 'run' : 'ride'})`
                  : `(${trendMagnitude.toFixed(2)} ml/kg/min per run)`
            : '(minimal change)'
          }
        </span>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartDataWithTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
            <XAxis
              dataKey="x"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--color-chart-axis)' }}
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis 
              domain={
                viewMode === 'heartRate'
                  ? ['dataMin - 5', 'dataMax + 5']
                  : viewMode === 'vo2'
                    ? ['dataMin - 2', 'dataMax + 2']
                    : ['dataMin - 0.5', 'dataMax + 0.5']
              }
              tick={{ fill: 'var(--color-chart-tick)' }}
              axisLine={{ stroke: 'var(--color-chart-axis)' }}
              label={{
                value: viewMode === 'pace'
                  ? (sport === 'Run' ? 'Pace (min/mile)' : 'Speed (mph)')
                  : viewMode === 'distance'
                    ? 'Distance (miles)'
                    : viewMode === 'heartRate'
                      ? 'Heart Rate (bpm)'
                      : 'Estimated VO2max (ml/kg/min)',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--color-chart-tick)'
              }}
              tickFormatter={(value) => 
                viewMode === 'pace' 
                  ? (sport === 'Run' ? formatPaceTime(value) : `${value.toFixed(1)}`)
                  : viewMode === 'distance'
                    ? `${value.toFixed(1)}`
                    : viewMode === 'heartRate'
                      ? `${Math.round(value)}`
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
                : viewMode === 'distance'
                  ? `${sportConfig.name} Distance`
                  : viewMode === 'heartRate'
                    ? `${sportConfig.name} Heart Rate`
                    : 'Estimated VO2max (Proxy)'
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
