import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getJson<{ activities: ActivityItem[] }>('/api/activities');
        if (!active) return;
        setActivities(data.activities ?? []);
        setError(null);
      } catch {
        if (!active) return;
        setActivities([]);
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
      title="Activities"
      description="Track student activity minutes and points."
      items={activities}
      isLoading={loading}
      error={error}
      emptyMessage="No activities"
      renderItem={(activity, index) => (
        <span key={`${activity.type ?? 'activity'}-${index}`}>
          {activity.type ?? 'Activity'} ({activity.minutes ?? 0} min, {activity.points ?? 0} pts)
        </span>
      )}
    />
  );
}
