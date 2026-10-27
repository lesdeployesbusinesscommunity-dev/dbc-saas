// Import Dependencies
import { Navigate, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import {
  BellAlertIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  MegaphoneIcon,
  RectangleGroupIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import {
  countOpenFollowUps,
  summarizeDossiers,
  useAntenneMembers,
  useLeaderDossiers,
  useLeaderFollowUps,
  useLeaderProfile,
} from "./leaderAccess";

// ----------------------------------------------------------------------

function Tab({ to, end, Icon, label, count, alert }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          isActive ? "bg-[#EE7115] text-white shadow-sm" : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className="size-4" />
          {label}
          {count > 0 && (
            <span
              className={clsx(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none",
                isActive ? "bg-white/25 text-white" : alert ? "bg-red-500 text-white" : "bg-[#EE7115] text-white",
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// Cadre commun des pages de l'Espace leader (/membre/leader/...) : le titre,
// la branche dirigée, puis les onglets — les entretiens à mener, les membres de
// l'antenne, les tontines de l'antenne, les annonces à ses membres, le guide de l'entretien et le rôle du
// leader. Réservé
// aux leaders : un simple membre qui ouvre l'adresse est renvoyé au dashboard.
export function LeaderShell({ children, searchValue, onSearchChange, searchPlaceholder }) {
  const { t } = useTranslation();
  const leader = useLeaderProfile();
  const dossiers = useLeaderDossiers();
  const roster = useAntenneMembers();
  const followUps = useLeaderFollowUps();

  if (!leader) return <Navigate to="/membre/dashboard" replace />;

  const { open } = summarizeDossiers(dossiers);
  const openFollowUps = countOpenFollowUps(followUps);
  const late = roster.filter((member) => member.contribution.state === "late").length;

  return (
    <Page title={`${t("membre.nav.leader")} – ${currentMember.name}`}>
      {/* "relative" : les textes et cases "sr-only" (positionnés en absolu) restent
          enfermés dans la zone qui défile. Sans lui, ils agrandissent la page
          entière et on voit le fond noir du navigateur sous l'espace membre. */}
      <div className="relative p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.leader"
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
          <ShieldCheckIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
          <span className="font-semibold text-gray-900">
            {t("membre.leader.banner", { branch: leader.branchName })}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <MapPinIcon aria-hidden="true" className="size-4 text-[#52A2DF]" />
            {leader.location}, {leader.country}
          </span>
        </p>

        <nav aria-label={t("membre.nav.leader")} className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <Tab to="/membre/leader" end Icon={ClipboardDocumentCheckIcon} label={t("membre.leader.tabs.interviews")} count={open} />
          <Tab to="/membre/leader/antenne" Icon={UsersIcon} label={t("membre.leader.tabs.antenne")} count={late} alert />
          <Tab to="/membre/leader/relances" Icon={BellAlertIcon} label={t("membre.leader.tabs.relances")} count={openFollowUps} alert />
          <Tab to="/membre/leader/tontine" Icon={RectangleGroupIcon} label={t("membre.leader.tabs.tontine")} />
          <Tab to="/membre/leader/annonces" Icon={MegaphoneIcon} label={t("membre.leader.tabs.annonces")} />
          <Tab to="/membre/leader/guide" Icon={BookOpenIcon} label={t("membre.leader.tabs.guide")} />
          <Tab to="/membre/leader/role" Icon={ShieldCheckIcon} label={t("membre.leader.tabs.role")} />
        </nav>

        <div className="mt-6">{children}</div>
      </div>
    </Page>
  );
}
