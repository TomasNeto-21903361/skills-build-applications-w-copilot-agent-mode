import type { ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  items?: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  renderItem?: (item: T, index: number) => ReactNode;
};

export function CapabilityCard<T>({
  title,
  description,
  items = [],
  isLoading = false,
  error = null,
  emptyMessage = 'No data available.',
  renderItem,
}: Props<T>) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>

        {isLoading ? (
          <p role="status">Loading...</p>
        ) : error ? (
          <div role="alert">Unable to load {title.toLowerCase()}.</div>
        ) : !hasItems ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul className="mb-0">
            {items.map((item, index) => (
              <li key={index}>{renderItem ? renderItem(item, index) : String(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
