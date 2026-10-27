// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { Avatar } from "../components/Avatar";
import { listMembers, useMembersStore } from "../Membres/membersStore";
import { useMembersFormat } from "../Membres/useMembersFormat";
import { normalizeSearchText } from "../searchUtils";
import { admitMember, removeMember, useInvestClub } from "./investClubStore";
import { clubTierOf, investTiers } from "./tiers";

// ----------------------------------------------------------------------

// Page "DBC Invest Club" de l'espace admin (/admin/invest-club). Le DBC
// Invest Club est un cercle d'accompagnement structuré, réservé aux membres
// investisseurs, organisé en 4 niveaux (voir le pilier "Financer" dans
// Gestion des piliers). Un niveau d'Invest Club s'ouvre avec un niveau DBC
// (voir tiers.js) ; avoir le bon niveau rend un membre ÉLIGIBLE, mais c'est
// l'administration qui l'ADMET dans le club (voir investClubStore.js) — d'où
// la liste ci-dessous, où l'on admet ou retire un membre.
const FILTERS = ["all", "admitted", "notAdmitted"];

export default function InvestClub() {
  const { t, i18n } = useTranslation();
  const { fullDate } = useMembersFormat();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const membersSnapshot = useMembersStore();
  const { admitted } = useInvestClub();
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState(0); // 0 = tous les niveaux
  const [statusFilter, setStatusFilter] = useState("all");

  const levelOf = (key) => levels.find((level) => level.key === key);

  // Tous les membres qui ont droit à au moins le niveau 1, avec leur niveau
  // d'Invest Club et leur état d'admission.
  const eligible = listMembers(membersSnapshot)
    .map((member) => ({
      ...member,
      tier: clubTierOf(member.levelKey),
      admission: admitted[member.id] ?? null,
    }))
    .filter((member) => member.tier > 0);

  const admittedCount = eligible.filter((member) => member.admission).length;
  const points = [1, 2, 3].map((n) => t(`piliers.items.invest-club.points.${n}`));

  const normalizedQuery = normalizeSearchText(query);
  const visible = eligible
    .filter((member) => tierFilter === 0 || member.tier === tierFilter)
    .filter(
      (member) =>
        statusFilter === "all" ||
        (statusFilter === "admitted" ? member.admission : !member.admission),
    )
    .filter(
      (member) =>
        !normalizedQuery ||
        normalizeSearchText(`${member.name} ${member.matricule} ${member.city} ${member.country}`).includes(
          normalizedQuery,
        ),
    )
    .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name, locale));

  const chip = (active) =>
    clsx(
      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
      active ? "bg-[#EE7115] text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50",
    );

  return (
    <Page title={`Admin – ${t("admin.investClub.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.investClub.title")}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("admin.investClub.searchPlaceholder")}
        />

        {/* Présentation du club, reprise du pilier. */}
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EE7115]/[0.1] text-[#EE7115]">
              <ArrowTrendingUpIcon aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900">{t("piliers.items.invest-club.name")}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-500">
                {t("piliers.items.invest-club.overview")}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {points.map((point) => (
                  <li
                    key={point}
                    className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-400">{t("piliers.items.invest-club.audience")}</p>
            </div>
          </div>
        </div>

        {/* Les 4 niveaux du club. */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {investTiers.map(({ tier, levelKey, color }) => {
            const level = levelOf(levelKey);
            const inTier = eligible.filter((member) => member.tier === tier);
            const admittedInTier = inTier.filter((member) => member.admission).length;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tierFilter === tier ? 0 : tier)}
                aria-pressed={tierFilter === tier}
                className={clsx(
                  "rounded-2xl border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md",
                  tierFilter === tier ? "border-[#EE7115] ring-1 ring-[#EE7115]" : "border-black/5",
                )}
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full text-base font-extrabold"
                  style={{ backgroundColor: `${color}1A`, color }}
                >
                  {tier}
                </span>
                <p className="mt-4 text-sm font-bold text-gray-900">{t("admin.investClub.tierName", { tier })}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <level.Icon aria-hidden="true" className="size-3.5 shrink-0" />
                  {t("admin.investClub.opensWith", { level: t(`simulateur.levels.${levelKey}.name`) })}
                </p>
                <p className="mt-4 text-2xl font-bold text-gray-900">{admittedInTier}</p>
                <p className="text-xs text-gray-500">
                  {t("admin.investClub.admittedOfEligible", { count: inTier.length })}
                </p>
              </button>
            );
          })}
        </div>

        {/* Liste des membres éligibles. */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <UserGroupIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
            {t("admin.investClub.membersTitle")}
            <span className="text-xs font-semibold text-gray-400">
              {t("admin.investClub.summary", { admitted: admittedCount, total: eligible.length })}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                aria-pressed={statusFilter === filter}
                className={chip(statusFilter === filter)}
              >
                {t(`admin.investClub.filters.${filter}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {visible.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">{t("admin.investClub.empty")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visible.map((member) => {
                const level = levelOf(member.levelKey);
                const canAdmit = member.status === "actif";
                return (
                  <li key={member.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                    <Avatar name={member.name} src={member.photo} size="size-11" />
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-bold text-gray-900">{member.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {member.matricule} · {member.city}, {member.country}
                      </p>
                    </div>

                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
                        level.borderClass,
                        level.textClass,
                        level.bgTintClass,
                      )}
                    >
                      <level.Icon aria-hidden="true" className="size-3.5" />
                      {t(`simulateur.levels.${member.levelKey}.name`)}
                    </span>

                    <span className="whitespace-nowrap rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-100">
                      {t("admin.investClub.tierName", { tier: member.tier })}
                    </span>

                    <div className="flex min-w-[9rem] flex-col text-xs">
                      {member.admission ? (
                        <>
                          <span className="flex items-center gap-1 font-semibold text-green-700">
                            <CheckCircleIcon aria-hidden="true" className="size-4" />
                            {t("admin.investClub.admitted")}
                          </span>
                          <span className="text-gray-400">
                            {t("admin.investClub.since", { date: fullDate(member.admission.at) })}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-gray-400">
                          <MinusCircleIcon aria-hidden="true" className="size-4" />
                          {t("admin.investClub.notAdmitted")}
                        </span>
                      )}
                    </div>

                    {member.admission ? (
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                      >
                        {t("admin.investClub.remove")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => admitMember(member.id)}
                        disabled={!canAdmit}
                        title={canAdmit ? undefined : t("admin.investClub.needsActive")}
                        className="flex items-center gap-1 rounded-lg bg-[#EE7115] px-3.5 py-2 text-xs font-semibold text-white transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
                      >
                        <PlusIcon aria-hidden="true" className="size-3.5" />
                        {t("admin.investClub.admit")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Page>
  );
}
