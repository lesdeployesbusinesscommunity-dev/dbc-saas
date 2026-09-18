// Import Dependencies
import dayjs from "dayjs";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckBadgeIcon,
  ShareIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { Avatar } from "../components/Avatar";
import { StatusBadge } from "./StatusBadge";
import { awardDefinitions } from "./mockData";

// ----------------------------------------------------------------------

// Icône + couleur par award (voir awardDefinitions dans mockData.js pour
// les clés de traduction du libellé et de la description de chacun).
const AWARD_STYLES = {
  cotisation: { Icon: CheckBadgeIcon, className: "bg-green-50 text-green-700" },
  parrainage: { Icon: UserGroupIcon, className: "bg-blue-50 text-blue-700" },
  formation: { Icon: AcademicCapIcon, className: "bg-orange-50 text-[#EE7115]" },
};

// Chiffres clés en tête de fiche, façon page profil des sites d'admin
// reconnus (Stripe, Linear...) : une rangée de tuiles avec icône + valeur
// + libellé, pour donner l'essentiel d'un coup d'œil avant le détail.
function StatTile({ Icon, tone, value, label }) {
  return (
    <div className={clsx("rounded-xl p-4", tone.tile)}>
      <Icon aria-hidden="true" className={clsx("size-5", tone.icon)} />
      <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

// Section d'infos secondaires, dans un encadré net (bordure + coins
// arrondis) pour que chaque bloc se distingue clairement des autres —
// c'est ce qui manquait à la version précédente ("tout est là mais en
// désordre").
function InfoSection({ Icon, title, children }) {
  return (
    <section className="rounded-xl border border-gray-100 p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
        <Icon aria-hidden="true" className="size-3.5" />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, align = "right" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd
        className={clsx(
          "font-semibold text-gray-800",
          align === "right" ? "text-right" : "text-left",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// Carte "Voir" d'un membre : ses chiffres clés en tuiles, ses infos
// générales organisées en sections nettement séparées, et son réseau de
// filleuls (parrainage) en bas. Purement en lecture — les modifications
// passent par "Mettre à jour" (voir RowActionsMenu / AddMemberModal).
//
// "networkContext" (optionnel) est fourni quand la fiche est ouverte
// depuis "Gestion du réseau" (voir Reseau/index.jsx) : le rôle et la
// branche occupés dans l'arbre administratif du pays, et l'étendue de sa
// responsabilité dans CET arbre (sous-branches directes, personnes en
// poste en dessous de lui...) — une notion différente du "parrainage"
// (sponsoredMembers) déjà affiché plus bas, qui reste la même quelle que
// soit la fiche d'où on l'ouvre.
//
// "extraBadge" (optionnel) est un simple texte affiché en pastille dans
// l'en-tête, à côté du niveau et du statut — utilisé par "Gestion de la
// gouvernance" pour rappeler le poste occupé (ex: "Directeur Marketing
// Digital · Comité Exécutif") sans les statistiques d'arbre ci-dessus,
// qui ne concernent que "Gestion du réseau".
export function MemberDetailsCard({ member, open, onClose, networkContext, extraBadge }) {
  const { t } = useTranslation();

  if (!member) return null;

  const money = (value) => formatMoney(value ?? 0);
  const filleulsCount = member.sponsoredMembers?.length ?? 0;
  const monthsFull = t("admin.common.monthsFull", { returnObjects: true });

  // Date complète avec l'année (ex: "5 septembre 2026"), plutôt qu'un
  // simple "jour du mois" — demandé explicitement par l'utilisateur.
  const formatFullDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = dayjs(dateStr);
    return `${date.date()} ${monthsFull[date.month()]} ${date.year()}`;
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-orange-50 p-6">
            <div className="flex items-center gap-4">
              <Avatar name={member.name} size="size-16" />
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {member.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  {member.matricule} · {member.role}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#EE7115] shadow-sm">
                    {t(`simulateur.levels.${member.levelKey}.name`)}
                  </span>
                  <StatusBadge status={member.status} />
                  {extraBadge && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600 shadow-sm">
                      {extraBadge}
                    </span>
                  )}
                  {networkContext && (
                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#52A2DF] shadow-sm">
                      <ShareIcon aria-hidden="true" className="size-3" />
                      {networkContext.branchLabel
                        ? `${networkContext.roleLabel} · ${networkContext.branchLabel}`
                        : networkContext.roleLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            {networkContext && (
              <div className="mb-6">
                <InfoSection Icon={ShareIcon} title={t("admin.reseau.details.title")}>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-[#52A2DF]/[0.08] p-3 text-center">
                      <p className="text-lg font-bold text-[#52A2DF]">
                        {networkContext.assignedCount}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-500">
                        {t("admin.reseau.details.peopleUnderResponsibility")}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-bold text-gray-800">
                        {networkContext.directBranches}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-500">
                        {t("admin.reseau.details.directBranches")}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-bold text-gray-800">
                        {networkContext.vacantCount}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-500">
                        {t("admin.reseau.details.vacantInTeam")}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3 divide-y divide-gray-50">
                    <InfoRow
                      label={t("admin.reseau.details.branch")}
                      value={
                        networkContext.branchLabel ?? t("admin.reseau.details.noBranch")
                      }
                    />
                    <InfoRow
                      label={t("admin.reseau.details.country")}
                      value={
                        <span className="flex items-center gap-1">
                          <MapPinIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                          {networkContext.country}
                        </span>
                      }
                    />
                  </dl>
                </InfoSection>
              </div>
            )}

            {member.awards?.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {member.awards.map((key) => {
                  const def = awardDefinitions[key];
                  const style = AWARD_STYLES[key];
                  if (!def || !style) return null;
                  const { Icon } = style;
                  return (
                    <span
                      key={key}
                      title={t(def.descriptionKey)}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                        style.className,
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {t(def.labelKey)}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                Icon={SparklesIcon}
                tone={{ tile: "bg-amber-50", icon: "text-amber-500" }}
                value={member.coins}
                label={t("admin.membres.details.coinsEarned")}
              />
              <StatTile
                Icon={BanknotesIcon}
                tone={{ tile: "bg-green-50", icon: "text-green-600" }}
                value={money(member.contributed)}
                label={t("admin.membres.details.amountContributedTile")}
              />
              <StatTile
                Icon={ArrowTrendingUpIcon}
                tone={{ tile: "bg-blue-50", icon: "text-blue-600" }}
                value={money(member.referralEarnings)}
                label={t("admin.membres.details.referralEarnings")}
              />
              <StatTile
                Icon={UserGroupIcon}
                tone={{ tile: "bg-orange-50", icon: "text-[#EE7115]" }}
                value={filleulsCount}
                label={
                  filleulsCount > 1
                    ? t("admin.membres.details.filleuls")
                    : t("admin.membres.details.filleul")
                }
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoSection Icon={UserGroupIcon} title={t("admin.membres.details.coordinates")}>
                <dl className="divide-y divide-gray-50">
                  <InfoRow label={t("admin.membres.details.city")} value={member.city} />
                  <InfoRow label={t("admin.membres.details.country")} value={member.country} />
                  <InfoRow label={t("admin.membres.details.domain")} value={member.domain} />
                  <InfoRow
                    label={t("admin.membres.details.sponsor")}
                    value={
                      member.sponsorName
                        ? `${member.sponsorName} (${member.sponsorMatricule})`
                        : t("admin.membres.details.noSponsor")
                    }
                  />
                </dl>
              </InfoSection>

              <InfoSection Icon={CalendarDaysIcon} title={t("admin.membres.details.tontine")}>
                <dl className="divide-y divide-gray-50">
                  <InfoRow
                    label={t("admin.membres.details.nextContribution")}
                    value={formatFullDate(member.nextTontineDate)}
                  />
                  <InfoRow
                    label={t("admin.membres.details.amountContributed")}
                    value={money(member.contributed)}
                  />
                </dl>
              </InfoSection>
            </div>

            <div className="mt-4">
              <InfoSection Icon={AcademicCapIcon} title={t("admin.membres.details.trainings")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      {t("admin.membres.details.inProgress")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {member.trainingInProgress ?? t("admin.membres.details.none")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      {t("admin.membres.details.completed")}
                    </p>
                    {member.trainingsCompleted?.length > 0 ? (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {member.trainingsCompleted.map((training) => (
                          <li
                            key={training}
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                          >
                            {training}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400">
                        {t("admin.membres.details.noneYet")}
                      </p>
                    )}
                  </div>
                </div>
              </InfoSection>
            </div>

            <div className="mt-4">
              <InfoSection Icon={UserGroupIcon} title={t("admin.membres.details.network")}>
                {member.sponsoredMembers?.length > 0 ? (
                  <ul className="space-y-2">
                    {member.sponsoredMembers.map((sponsored) => (
                      <li
                        key={sponsored.matricule}
                        className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2"
                      >
                        <Avatar name={sponsored.name} size="size-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {sponsored.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {sponsored.matricule} · {sponsored.city}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">
                    {t("admin.membres.details.noSponsoredMembers")}
                  </p>
                )}
              </InfoSection>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
