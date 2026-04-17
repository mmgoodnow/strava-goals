'use client';

import { useState } from 'react';
import { metersToMiles, SportType, SPORT_CONFIG } from '@/lib/utils';

interface GoalSetterProps {
  currentGoal: number;
  onGoalUpdate: (goal: number) => void;
  sport: SportType;
}

export default function GoalSetter({ currentGoal, onGoalUpdate, sport }: GoalSetterProps) {
  const sportConfig = SPORT_CONFIG[sport];
  const currentGoalMiles = Math.round(metersToMiles(currentGoal));
  const [customValue, setCustomValue] = useState('');

  const handleQuickSelect = (miles: number) => {
    onGoalUpdate(miles * 1609.34);
    setCustomValue('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const miles = parseFloat(customValue);
    if (!isNaN(miles) && miles > 0) {
      onGoalUpdate(miles * 1609.34);
      setCustomValue('');
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-foreground-strong mb-4">Yearly Goal</h2>

      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-orange-500 mb-2">
          {currentGoalMiles}
        </div>
        <div className="text-xl text-foreground-muted">
          miles
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-foreground-muted text-center mb-2">Quick select:</p>
          <div className="grid grid-cols-4 gap-2">
            {sportConfig.goalRanges.map((goal) => (
              <button
                key={goal}
                onClick={() => handleQuickSelect(goal)}
                className={`py-2 px-3 rounded-lg font-medium transition ${
                  currentGoalMiles === goal
                    ? 'bg-orange-500 text-white'
                    : 'bg-surface-muted text-foreground hover:bg-surface-hover'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-foreground-subtle">or</span>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Custom goal"
            className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!customValue || parseFloat(customValue) <= 0}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:bg-surface-muted disabled:text-foreground-subtle disabled:cursor-not-allowed"
          >
            Set
          </button>
        </form>
      </div>
    </div>
  );
}
