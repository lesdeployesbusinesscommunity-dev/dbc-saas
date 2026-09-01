// Import Dependencies
import { NavLink, Link } from "react-router";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Liens du menu. Seul "Home" (/accueil) est déjà branché à une page pour
// l'instant, les autres pointent vers de futures pages qu'on construira
// ensuite (A propos, Simulateur de revenus, Revenus et tarif, Contacts).
const navLinks = [
  { label: "Home", to: "/accueil" },
  { label: "A propos", to: "/a-propos" },
  { label: "Simulateur de revenus", to: "/simulateur-de-revenus" },
  { label: "Revenus et tarif", to: "/revenus-et-tarif" },
  { label: "Contacts", to: "/contacts" },
];

// Header du site public : logo + nom "Les Déployés Business Community",
// menu de navigation (la page active est mise en avant : orange, plus
// grande, en gras, soulignée), et bouton "Se connecter" en orange plein.
// Une fine ligne bleue le sépare du reste de la page (body).
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-[#52A2DF]/25 bg-white">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo + nom du site, cliquable pour revenir à l'accueil.
            On utilise "logo-icon.jpg" (le pictogramme seul, recadré et
            allégé à partir de logo.jpeg qui contenait beaucoup de marge
            blanche autour) et "object-contain" pour ne jamais le couper
            ni le flouter. */}
        <Link to="/accueil" className="flex shrink-0 items-center gap-3">
          <img
            src="/logo-icon.jpg"
            alt="Logo DBC"
            className="h-12 w-auto object-contain sm:h-14"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#EE7115] sm:text-base">
              Les Déployés
            </p>
            <p className="text-sm font-bold text-[#EE7115] sm:text-base">
              Business Community
            </p>
          </div>
        </Link>

        {/* Menu de navigation (caché sur petit écran, visible à partir de "lg") */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  "whitespace-nowrap border-b-2 pb-1 transition-colors",
                  isActive
                    ? "border-[#EE7115] text-base font-bold text-[#EE7115]"
                    : "border-transparent text-sm font-medium text-gray-500 hover:text-gray-800",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bouton qui envoie vers la page de connexion existante */}
        <Link
          to="/login"
          className="shrink-0 rounded-lg bg-[#EE7115] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Se connecter
        </Link>
      </div>
    </header>
  );
}
