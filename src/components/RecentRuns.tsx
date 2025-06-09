'use client';

import { formatDistance, formatPace } from '@/lib/utils';

interface RecentRunsProps {
  activities: any[];
}

export default function RecentRuns({ activities }: RecentRunsProps) {
  const recentRuns = activities.slice(0, 10);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Runs</h2>
      
      {recentRuns.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No runs recorded this year yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-semibold">Date</th>
                <th className="text-left py-2 text-gray-600 font-semibold">Distance</th>
                <th className="text-left py-2 text-gray-600 font-semibold">Time</th>
                <th className="text-left py-2 text-gray-600 font-semibold">Pace</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => {
                const metersPerSecond = run.distance > 0 ? run.distance / run.moving_time : 0;
                return (
                  <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="text-gray-800">{formatDate(run.start_date)}</div>
                        <div className="text-sm text-gray-500">{run.name}</div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-800">
                      {formatDistance(run.distance)}
                    </td>
                    <td className="py-3 text-gray-800">
                      {formatDuration(run.moving_time)}
                    </td>
                    <td className="py-3 text-gray-800">
                      {formatPace(metersPerSecond)}/mi
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}