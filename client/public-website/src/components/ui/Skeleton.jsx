/** Grey bar that stands in for a figure while it loads. Size it with width/height classes. */
export default function Skeleton({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-pulse rounded bg-haze-soft align-middle ${className}`}
    />
  );
}
