// ----------------------------------------------------------------------

// Carte blanche du niveau ouvert : une simple étiquette (pas de languette
// en diagonale) qui rappelle le niveau en cours, au-dessus de la barre
// d'outils + du tableau — look aligné sur la maquette de référence donnée
// par l'utilisateur (carte blanche sobre, pas d'effet "dossier suspendu").
export function MembersFolder({ label, children }) {
  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <span className="inline-flex items-center rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-[#EE7115]">
        {label}
      </span>

      <div className="mt-5">{children}</div>
    </div>
  );
}
