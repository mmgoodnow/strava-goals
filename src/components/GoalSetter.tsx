'use client';

import { metersToMiles } from '@/lib/utils';

interface GoalSetterProps {
  currentGoal: number;
  onGoalUpdate: (goal: number) => void;
}

const COMMON_GOALS = [100, 200, 300, 500, 750, 1000, 1500, 2000];

export default function GoalSetter({ currentGoal, onGoalUpdate }: GoalSetterProps) {
  const currentGoalMiles = Math.round(metersToMiles(currentGoal));

  const handleQuickSelect = (miles: number) => {
    onGoalUpdate(miles * 1609.34);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Yearly Goal</h2>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-orange-500 mb-2">
          {currentGoalMiles}
        </div>
        <div className="text-xl text-gray-600">
          miles
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-gray-600 text-center">Quick select:</p>
        <div className="grid grid-cols-4 gap-2">
          {COMMON_GOALS.map((goal) => (
            <button
              key={goal}
              onClick={() => handleQuickSelect(goal)}
              className={`py-2 px-3 rounded-lg font-medium transition ${
                currentGoalMiles === goal
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}