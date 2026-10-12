// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { StatusBadge } from "./StatusBadge";
import { RowActionsMenu } from "./RowActionsMenu";

// ----------------------------------------------------------------------

const COLUMN_KEYS = [
  "name", "matricule", "role", "domain", "level",
  "city", "country", "sponsor", "coins", "status",
];

// Tableau des membres du dossier ouvert (ou de "Tous les niveaux"). Le
// niveau de chaque ligne est dérivé de son propre "levelKey" et affiché en
// toutes lettres (ex: "DBC Starter") via la traduction partagée avec la
// page Simulateur — reste correct que le dossier ouvert soit un seul
// niveau ou la vue combinée. En-tête sur fond gris clair et lignes qui
// s'éclaircissent au survol, pour se rapprocher de la maquette de
// référence donnée par l'utilisateur.
export function MembersTable({ members, onUpdate, onView, onToggleStatus, onDelete }) {
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
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {COLUMN_KEYS.map((key) => (
              <th key={key} scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                {t(`admin.membres.table.columns.${key}`)}
              </th>
            ))}
            <th scope="col" className="whitespace-nowrap px-3 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className={clsx(
                "border-t border-gray-100 transition-colors",
                member.status === "desactive"
                  ? "bg-gray-50 opacity-60"
                  : "hover:bg-gray-50/70",
              )}
            >
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} size="size-9" />
                  <span className="font-semibold text-gray-900">{member.name}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-gray-600">{member.matricule}</td>
              <td className="whitespace-nowrap px-3 py-3 text-gray-600">{member.role}</td>
              <td className="px-3 py-3 text-gray-600">{member.domain}</td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-800">
                {t(`simulateur.levels.${member.levelKey}.name`)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-gray-600">{member.city}</td>
              <td className="whitespace-nowrap px-3 py-3 text-gray-600">{member.country}</td>
              <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                {member.sponsorName ? (
                  <div className="leading-tight">
                    <p className="font-semibold text-gray-800">{member.sponsorName}</p>
                    <p className="text-xs text-gray-400">{member.sponsorMatricule}</p>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">
                    {t("admin.membres.table.noSponsor")}
                  </span>
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
                  onUpdate={() => onUpdate(member)}
                  onView={() => onView(member)}
                  onToggleStatus={() => onToggleStatus(member)}
                  onDelete={() => onDelete(member)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
