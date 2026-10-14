import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = {
  name?: string;
  members?: Array<string | { toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getJson<{ teams: TeamItem[] }>('/api/teams');
        if (!active) return;
        setTeams(data.teams ?? []);
        setError(null);
      } catch {
        if (!active) return;
        setTeams([]);
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
      title="Teams"
      description="Manage teams and members."
      items={teams}
      isLoading={loading}
      error={error}
      emptyMessage="No teams"
      renderItem={(team, index) => (
        <span key={`${team.name ?? 'team'}-${index}`}>
          {team.name ?? 'Team'} ({(team.members ?? []).map((member) => String(member)).join(', ') || 'No members'})
        </span>
      )}
    />
  );
}
