// ----------------------------------------------------------------------

// Carte de section réutilisable pour toute la page Paramètres — même
// gabarit que les cartes de pôle de Gestion de la gouvernance (icône +
// titre + description en en-tête, contenu en dessous), pour que
// "Paramètres" reste visuellement cohérent avec le reste de l'admin.
export function SettingsSection({ Icon, title, description, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#52A2DF]/[0.1] text-[#52A2DF]">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
