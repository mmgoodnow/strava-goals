'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { 
  convertPaceToMinutesPerMile, 
  formatPaceMinutes, 
  calculatePaceImprovement,
  getDistanceRangeLabel,
  calculateYearOverYearTrend,
  findBestAndWorstYears
} from '@/lib/utils';

interface YearlyData {
  year: number;
  totalRuns: number;
  totalDistance: number;
  totalTime: number;
  averagePace: number;
  rangeAnalysis: Record<string, {
    count: number;
    averagePace: number;
    totalDistance: number;
  }>;
}

interface HistoricalData {
  yearlyData: YearlyData[];
}

export default function PaceAnalysis() {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('overall');

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/strava/historical');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please reconnect to Strava');
        }
        throw new Error('Failed to fetch historical data');
      }

      const historicalData = await response.json();
      setData(historicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Multi-Year Pace Analysis</h2>
        <p className="text-red-600">{error || 'No data available'}</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.yearlyData.map(yearData => ({
    year: yearData.year,
    overallPace: convertPaceToMinutesPerMile(yearData.averagePace),
    totalRuns: yearData.totalRuns,
    totalMiles: yearData.totalDistance * 0.000621371,
    ...Object.entries(yearData.rangeAnalysis).reduce((acc, [range, analysis]) => {
      acc[`${range}Pace`] = convertPaceToMinutesPerMile(analysis.averagePace);
      return acc;
    }, {} as Record<string, number>)
  }));

  // Calculate trend analysis
  const trendData = data.yearlyData.map(d => ({ year: d.year, averagePace: d.averagePace }));
  const trend = calculateYearOverYearTrend(trendData);
  const { best } = findBestAndWorstYears(trendData);

  // Calculate overall improvement
  const firstYear = chartData[chartData.length - 1];
  const lastYear = chartData[0];
  const overallImprovement = firstYear && lastYear ? 
    calculatePaceImprovement(firstYear.overallPace, lastYear.overallPace) : 0;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'overallPace' ? 'Overall' : 
               entry.dataKey.replace('Pace', '').replace(/([A-Z])/g, ' $1').trim()}: {' '}
              {formatPaceMinutes(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Multi-Year Pace Analysis</h2>
        <p className="text-gray-600">Track your pace improvements over time</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">Overall Trend</h3>
          <p className={`text-lg font-bold ${trend?.isImproving ? 'text-green-600' : 'text-red-600'}`}>
            {trend?.isImproving ? 'Improving' : 'Declining'}
          </p>
          {overallImprovement !== 0 && (
            <p className="text-sm text-gray-600">
              {overallImprovement > 0 ? '+' : ''}{overallImprovement.toFixed(1)}%
            </p>
          )}
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-green-800 mb-1">Best Year</h3>
          <p className="text-lg font-bold text-green-600">
            {best ? best.year : 'N/A'}
          </p>
          {best && (
            <p className="text-sm text-gray-600">
              {formatPaceMinutes(convertPaceToMinutesPerMile(best.averagePace))}
            </p>
          )}
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-orange-800 mb-1">Total Years</h3>
          <p className="text-lg font-bold text-orange-600">{data.yearlyData.length}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-800 mb-1">Total Runs</h3>
          <p className="text-lg font-bold text-purple-600">
            {data.yearlyData.reduce((sum, year) => sum + year.totalRuns, 0)}
          </p>
        </div>
      </div>

      {/* Distance Range Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          View pace by distance range:
        </label>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="overall">Overall Average</option>
          <option value="short">Short Runs (&lt; 5K)</option>
          <option value="medium">Medium Runs (5K-10K)</option>
          <option value="long">Long Runs (10K-Half)</option>
          <option value="ultraLong">Ultra Long (Half+)</option>
        </select>
      </div>

      {/* Pace Trend Chart */}
      <div className="h-80 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Pace (min/mile)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedRange === 'overall' ? (
              <Line 
                type="monotone" 
                dataKey="overallPace" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                name="Overall Pace"
              />
            ) : (
              <Line 
                type="monotone" 
                dataKey={`${selectedRange}Pace`} 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                name={getDistanceRangeLabel(selectedRange)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="h-64">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Annual Running Volume</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Miles', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'totalMiles' ? `${value.toFixed(0)} miles` : `${value} runs`,
                name === 'totalMiles' ? 'Total Miles' : 'Total Runs'
              ]}
            />
            <Legend />
            <Bar dataKey="totalMiles" fill="#3b82f6" name="Total Miles" />
            <Bar dataKey="totalRuns" fill="#10b981" name="Total Runs" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}