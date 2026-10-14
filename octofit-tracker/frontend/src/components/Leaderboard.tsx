import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardItem = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getJson<{ leaderboard: LeaderboardItem[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(data.leaderboard ?? []);
        setError(null);
      } catch {
        if (!active) return;
        setLeaderboard([]);
        setError('Unavailable');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      items={leaderboard}
      isLoading={loading}
      error={error}
      emptyMessage="No leaderboard"
      renderItem={(entry, index) => (
        <span key={`${entry.teamName ?? 'team'}-${index}`}>
          {entry.teamName ?? 'Team'}: {entry.totalPoints ?? 0} pts (#{entry.rank ?? index + 1})
        </span>
      )}
    />
  );
}
