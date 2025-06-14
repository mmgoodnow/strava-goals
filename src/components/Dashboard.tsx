'use client';

import { useState, useEffect, useCallback } from 'react';
import ProgressCard from './ProgressCard';
import RunChart from './RunChart';
import RecentRuns from './RecentRuns';
import GoalSetter from './GoalSetter';
import ProgressLineChart from './ProgressLineChart';
import WeeklyTargets from './WeeklyTargets';
import PaceAnalysisChart from './PaceAnalysisChart';
import { SportType, SPORT_CONFIG } from '@/lib/utils';

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number;
  start_date: string;
  moving_time: number;
}

interface DashboardData {
  activities: Activity[];
  totalDistance: number;
  monthlyDistance: Record<number, number>;
  count: number;
  stats?: {
    recent_run_totals?: {
      count: number;
      distance: number;
    };
  };
  athlete?: {
    firstname?: string;
    lastname?: string;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sport, setSport] = useState<SportType>('Run'); // Start with default
  const [yearlyGoal, setYearlyGoal] = useState<number>(1000 * 1609.34); // Start with default
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration effect - load from localStorage after component mounts
  useEffect(() => {
    setIsHydrated(true);
    const savedSport = localStorage.getItem('selectedSport') as SportType;
    const selectedSport = savedSport || 'Run';
    
    setSport(selectedSport);
    
    // Load the appropriate goal for the sport
    const goalKey = selectedSport === 'Run' ? 'yearlyRunGoal' : 'yearlyCyclingGoal';
    const savedGoal = localStorage.getItem(goalKey);
    const defaultGoal = selectedSport === 'Run' ? 1000 : 3000;
    setYearlyGoal(savedGoal ? parseFloat(savedGoal) : defaultGoal * 1609.34);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [activitiesRes, statsRes] = await Promise.all([
        fetch(`/api/strava/activities?sport=${sport}`),
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
  }, [sport]);

  useEffect(() => {
    if (isHydrated) {
      fetchData();
    }
  }, [sport, isHydrated, fetchData]);

  const handleGoalUpdate = (newGoal: number) => {
    setYearlyGoal(newGoal);
    const goalKey = sport === 'Run' ? 'yearlyRunGoal' : 'yearlyCyclingGoal';
    localStorage.setItem(goalKey, newGoal.toString());
  };

  const handleSportChange = (newSport: SportType) => {
    setSport(newSport);
    localStorage.setItem('selectedSport', newSport);
    
    // Load the goal for the new sport
    const goalKey = newSport === 'Run' ? 'yearlyRunGoal' : 'yearlyCyclingGoal';
    const saved = localStorage.getItem(goalKey);
    const defaultGoal = newSport === 'Run' ? 1000 : 3000;
    setYearlyGoal(saved ? parseFloat(saved) : defaultGoal * 1609.34);
  };

  const sportConfig = SPORT_CONFIG[sport];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Always visible */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {data?.athlete?.firstname ? `${data.athlete.firstname}'s ` : ''}{sportConfig.name} Goals
            </h1>
            <p className="text-gray-600">Track your yearly {sportConfig.name.toLowerCase()} progress</p>
          </div>
          
          {/* Sport Selector - Always visible */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(Object.keys(SPORT_CONFIG) as SportType[]).map((sportType) => (
              <button
                key={sportType}
                onClick={() => handleSportChange(sportType)}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  sport === sportType
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {SPORT_CONFIG[sportType].icon} {SPORT_CONFIG[sportType].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your {sportConfig.name.toLowerCase()} data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-32">
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
      ) : !data ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Content */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ProgressCard 
          totalDistance={data.totalDistance}
          yearlyGoal={yearlyGoal}
          runCount={data.count}
        />
        <GoalSetter 
          currentGoal={yearlyGoal}
          onGoalUpdate={handleGoalUpdate}
          sport={sport}
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

          <div className="mb-8">
            <PaceAnalysisChart sport={sport} />
          </div>
        </>
      )}
    </div>
  );
}