// ----------------------------------------------------------------------
// Une carte de statistique financière — même langage visuel que les
// cartes du Dashboard (icône en pastille de couleur + gros chiffre +
// libellé, voir Admin/Dashboard/StatsGrid.jsx), en plus grand puisqu'il
// n'y en a que 4 ici.
export function FinanceStatCard({ Icon, color, value, label }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm+ text-gray-500">{label}</p>
    </div>
  );
}
