// Import Dependencies
import { ShieldCheckIcon } from "@heroicons/react/24/solid";

// Local Imports
import { useLeaderLabels } from "./leaderData";

// ----------------------------------------------------------------------

// Pastille "fonction de leader" : discrète dans le tableau, avec le
// périmètre en infobulle (title).
export function LeaderBadge({ term }) {
  const { functionLabel } = useLeaderLabels();
  if (!term) return null;
  const label = functionLabel(term);
  return (
    <span
      title={term.scope ? `${label} · ${term.scope}` : label}
      className="inline-flex max-w-[200px] items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-[#EE7115] ring-1 ring-inset ring-orange-600/20"
    >
      <ShieldCheckIcon aria-hidden="true" className="size-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
