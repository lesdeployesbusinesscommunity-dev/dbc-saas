// Import Dependencies
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

// Pied de page minimal pour les espaces connectés (Admin, Membre) — pas le
// grand footer marketing de la partie publique (voir
// components/shared/PublicFooter.jsx : logo, navigation, coordonnées,
// appel à l'action), juste une ligne de copyright discrète en bas du
// contenu, comme la plupart des templates de dashboard. Absent jusqu'ici
// des deux espaces connectés (signalé à l'usage). Même texte de copyright
// que le footer public ("visiteur.footer.copyright"), pour ne pas
// dupliquer cette info à deux endroits.
export function DashboardFooter() {
  const { t } = useTranslation();

  return (
    <footer className="shrink-0 border-t border-black/5 px-6 py-4 text-center text-xs text-gray-400 lg:px-8">
      © {new Date().getFullYear()} {t("visiteur.footer.copyright")}
    </footer>
  );
}
