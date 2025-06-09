'use client';

import { useState, useEffect } from 'react';
import ProgressCard from './ProgressCard';
import RunChart from './RunChart';
import RecentRuns from './RecentRuns';
import GoalSetter from './GoalSetter';
import ProgressLineChart from './ProgressLineChart';
import WeeklyTargets from './WeeklyTargets';

interface DashboardData {
  activities: any[];
  totalDistance: number;
  monthlyDistance: Record<number, number>;
  count: number;
  stats?: any;
  athlete?: any;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyGoal, setYearlyGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yearlyRunGoal');
      return saved ? parseFloat(saved) : 1000 * 1609.34; // Default: 1000 miles in meters
    }
    return 1000 * 1609.34;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, statsRes] = await Promise.all([
        fetch('/api/strava/activities'),
        fetch('/api/strava/stats')
      ]);

      if (!activitiesRes.ok || !statsRes.ok) {
        if (activitiesRes.status === 401 || statsRes.status === 401) {
          window.location.href = '/api/auth/strava';
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const activitiesData = await activitiesRes.json();
      const statsData = await statsRes.json();

      setData({ ...activitiesData, ...statsData });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoalUpdate = (newGoal: number) => {
    setYearlyGoal(newGoal);
    localStorage.setItem('yearlyRunGoal', newGoal.toString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your running data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.href = '/api/auth/strava'}
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Connect to Strava
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {data.athlete?.firstname ? `${data.athlete.firstname}'s ` : ''}Running Goals
        </h1>
        <p className="text-gray-600">Track your yearly running progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ProgressCard 
          totalDistance={data.totalDistance}
          yearlyGoal={yearlyGoal}
          runCount={data.count}
        />
        <GoalSetter 
          currentGoal={yearlyGoal}
          onGoalUpdate={handleGoalUpdate}
        />
        <WeeklyTargets 
          totalDistance={data.totalDistance}
          yearlyGoal={yearlyGoal}
        />
      </div>

      <div className="mb-8">
        <ProgressLineChart 
          activities={data.activities}
          yearlyGoal={yearlyGoal}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RunChart monthlyDistance={data.monthlyDistance} yearlyGoal={yearlyGoal} />
        <RecentRuns activities={data.activities} />
      </div>
    </div>
  );
}