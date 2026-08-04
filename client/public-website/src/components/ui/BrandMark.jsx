import logoImage from "../../assets/logo.png";

/**
 * The Milk Nest logo is a full circular lockup (emblem + wordmark + tagline),
 * which is unreadable at navbar size. `compact` crops into the emblem and pairs
 * it with a live text wordmark; `full` shows the artwork as supplied.
 */
export default function BrandMark({
  variant = "compact",
  tone = "light",
  className = "",
  showWordmark = true,
}) {
  if (variant === "full") {
    return (
      <img
        src={logoImage}
        alt="Milk Nest — smart dairy farm management"
        className={`h-auto w-full object-contain ${className}`}
      />
    );
  }

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-navy-900/10 shadow-sm transition-transform duration-500 group-hover:scale-105">
        <img
          src={logoImage}
          alt=""
          aria-hidden="true"
          className="size-full origin-[50%_10%] scale-[2] object-cover"
        />
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-tr from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </span>

      {showWordmark ? (
        <span className="text-[1.35rem] leading-none font-extrabold tracking-tight">
          <span className={tone === "dark" ? "text-white" : "text-navy-800"}>Milk</span>
          <span className={tone === "dark" ? "text-grass-400" : "text-grass-500"}>nest</span>
        </span>
      ) : null}
    </span>
  );
}
