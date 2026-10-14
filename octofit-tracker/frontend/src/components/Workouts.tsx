import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
  focus?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const encodedUser = encodeURIComponent('mona@example.com');
        const data = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodedUser}`);
        if (!active) return;
        setSuggestions(data.suggestions ?? []);
        setError(null);
      } catch {
        if (!active) return;
        setSuggestions([]);
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      items={suggestions}
      isLoading={loading}
      error={error}
      emptyMessage="No workout suggestions"
      renderItem={(suggestion, index) => (
        <span key={`${suggestion.title ?? 'workout'}-${index}`}>
          {suggestion.title ?? 'Workout'} {suggestion.focus ? `(${suggestion.focus})` : ''} - {suggestion.reason ?? 'Build endurance'}
        </span>
      )}
    />
  );
}
