'use client';

import { formatDistance, formatPace } from '@/lib/utils';

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number;
  start_date: string;
  moving_time: number;
}

interface RecentRunsProps {
  activities: Activity[];
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
    <div className="bg-surface rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-foreground-strong mb-4">Recent Runs</h2>

      {recentRuns.length === 0 ? (
        <p className="text-foreground-muted text-center py-8">No runs recorded this year yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground-muted font-semibold">Date</th>
                <th className="text-left py-2 text-foreground-muted font-semibold">Distance</th>
                <th className="text-left py-2 text-foreground-muted font-semibold">Time</th>
                <th className="text-left py-2 text-foreground-muted font-semibold">Pace</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => {
                const metersPerSecond = run.distance > 0 ? run.distance / run.moving_time : 0;
                return (
                  <tr key={run.id} className="border-b border-border-subtle hover:bg-surface-muted">
                    <td className="py-3">
                      <div>
                        <div className="text-foreground">{formatDate(run.start_date)}</div>
                        <div className="text-sm text-foreground-subtle">{run.name}</div>
                      </div>
                    </td>
                    <td className="py-3 text-foreground">
                      {formatDistance(run.distance)}
                    </td>
                    <td className="py-3 text-foreground">
                      {formatDuration(run.moving_time)}
                    </td>
                    <td className="py-3 text-foreground">
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
