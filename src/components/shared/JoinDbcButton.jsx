// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Bouton "Rejoins la DBC" réutilisable (hero, widget flottant "3 Profils
// de Membres", footer, etc.). "className" permet d'ajuster le style selon
// l'endroit où il est utilisé (ex: pleine largeur dans une bulle de chat).
// Note : l'opacité arbitraire doit être écrite avec des crochets
// ("/[0.32]") et non juste "/32" — Tailwind ne génère la classe que si
// la valeur d'opacité existe dans son échelle prédéfinie, sinon rien ne
// s'affiche silencieusement.
export function JoinDbcButton({ className }) {
  const { t } = useTranslation();

  return (
    <Link
      to="/inscription"
      className={clsx(
        "rounded-lg border border-[#EE7115] bg-[#EE7115]/[0.32] px-5 py-2.5 text-sm font-semibold text-[#EE7115] transition-colors hover:bg-[#EE7115]/[0.45]",
        className,
      )}
    >
      {t("visiteur.joinButton")}
    </Link>
  );
}
