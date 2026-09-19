// Import Dependencies
import clsx from "clsx";

// ----------------------------------------------------------------------

// Interrupteur à bascule (façon iOS/Stripe) — utilisé partout dans cette
// page pour les réglages "activé/désactivé" (deux-facteurs, export
// automatique, chaque case de la matrice de notifications...), plutôt
// qu'une case à cocher classique, pour rester dans le langage visuel des
// sites d'administration reconnus.
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF] focus-visible:ring-offset-2",
        checked ? "bg-[#52A2DF]" : "bg-gray-200",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
