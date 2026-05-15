export interface ConnectionBadgeProps {
  connected: boolean;
  className: string;
  dotClassName: string;
}

export function ConnectionBadge({
  connected,
  className,
  dotClassName,
}: ConnectionBadgeProps) {
  return (
    <span className={className}>
      <span className={dotClassName} aria-hidden="true" />
      {connected ? 'Live' : 'Connecting…'}
    </span>
  );
}
