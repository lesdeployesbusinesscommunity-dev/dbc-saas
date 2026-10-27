// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { StatusBadge } from "./StatusBadge";
import { LeaderBadge } from "./LeaderBadge";
import { RowActionsMenu } from "./RowActionsMenu";

// ----------------------------------------------------------------------

// Tableau des membres du dossier ouvert (ou de "Tous les niveaux"), en
// 8 colonnes lisibles : le membre (nom + matricule), son rôle et sa
// fonction de leader éventuelle (avec son domaine d'activité en dessous),
// son niveau, sa localisation (ville · pays), son parrain, ses coins et
// son état. Le niveau de chaque ligne vient de son "levelKey" et s'affiche
// en toutes lettres (ex: "DBC Starter"), traduit comme sur la page
// Simulateur. Cliquer sur le nom ouvre la fiche avec le suivi complet.
//
// "termsByMember" : mandat de leader EN COURS de chaque membre (par id).
export function MembersTable({
  members,
  termsByMember,
  onUpdate,
  onView,
  onToggleStatus,
  onDelete,
  onAppoint,
  onEditLeader,
  onDismissLeader,
}) {
  const { t } = useTranslation();

  if (members.length === 0) {
    return (
      <p className="mt-6 py-10 text-center text-sm text-gray-500">
        {t("admin.membres.table.empty")}
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {["member", "roleFunction", "level", "location", "sponsor", "coins", "status"].map((key) => (
              <th key={key} scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                {t(`admin.membres.table.columns.${key}`)}
              </th>
            ))}
            <th scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
              <span className="sr-only">{t("admin.membres.rowMenu.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const term = termsByMember[member.id] ?? null;
            return (
              <tr
                key={member.id}
                className={clsx(
                  "border-t border-gray-100 transition-colors",
                  member.status === "desactive" ? "bg-gray-50 opacity-60" : "hover:bg-gray-50/70",
                )}
              >
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onView(member)}
                    className="flex items-center gap-3 text-left"
                  >
                    <Avatar name={member.name} size="size-9" />
                    <span className="leading-tight">
                      <span className="block whitespace-nowrap font-semibold text-gray-900 hover:text-[#52A2DF]">
                        {member.name}
                      </span>
                      <span className="block text-xs text-gray-400">{member.matricule}</span>
                    </span>
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="leading-tight">
                    <p className="whitespace-nowrap font-medium text-gray-700">{member.role}</p>
                    {member.domain && (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-400" title={member.domain}>
                        {member.domain}
                      </p>
                    )}
                    {term && (
                      <div className="mt-1">
                        <LeaderBadge term={term} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-800">
                  {t(`simulateur.levels.${member.levelKey}.name`)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                  {[member.city, member.country].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                  {member.sponsorName ? (
                    <div className="leading-tight">
                      <p className="font-semibold text-gray-800">{member.sponsorName}</p>
                      <p className="text-xs text-gray-400">{member.sponsorMatricule}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">{t("admin.membres.table.noSponsor")}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-800">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-full bg-amber-400" />
                    {member.coins}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <StatusBadge status={member.status} />
                </td>
                <td className="px-3 py-3 text-right">
                  <RowActionsMenu
                    status={member.status}
                    isLeader={!!term}
                    onUpdate={() => onUpdate(member)}
                    onView={() => onView(member)}
                    onToggleStatus={() => onToggleStatus(member)}
                    onDelete={() => onDelete(member)}
                    onAppoint={() => onAppoint(member)}
                    onEditLeader={() => onEditLeader(term)}
                    onDismissLeader={() => onDismissLeader(term)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
