// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { SeatCard } from "./SeatCard";
import { getMember, getPoleTitle, getPoleDescription, getSeatTitle } from "./mockData";

// ----------------------------------------------------------------------

// Un bouton d'action discret dans l'en-tête d'un pôle (monter/descendre/
// modifier/supprimer) — même gabarit partout, juste l'icône et la
// couleur au survol qui changent.
function HeaderIconButton({ Icon, label, onClick, disabled, hoverClassName }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors",
        disabled ? "opacity-30" : ["hover:bg-gray-100", hoverClassName ?? "hover:text-gray-700"],
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}

// En-tête commun à tous les pôles : pastille numérotée (recalculée selon
// la position du pôle dans la page — voir Gouvernance/index.jsx) + icône,
// titre, description, puis les actions d'administration de la carte
// elle-même (monter/descendre/modifier/supprimer — voir "Ajouter un
// pôle" dans Gouvernance/index.jsx pour la création).
function PoleHeader({
  number,
  Icon,
  title,
  description,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EE7115]/[0.1] text-base font-extrabold text-[#EE7115]">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-[#52A2DF]" />
            <span className="truncate">{title}</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <HeaderIconButton
          Icon={ChevronUpIcon}
          label={t("admin.gouvernance.moveUp")}
          onClick={onMoveUp}
          disabled={!canMoveUp}
        />
        <HeaderIconButton
          Icon={ChevronDownIcon}
          label={t("admin.gouvernance.moveDown")}
          onClick={onMoveDown}
          disabled={!canMoveDown}
        />
        <HeaderIconButton
          Icon={PencilIcon}
          label={t("admin.gouvernance.edit")}
          onClick={onEdit}
          hoverClassName="hover:text-[#52A2DF]"
        />
        <HeaderIconButton
          Icon={TrashIcon}
          label={t("admin.gouvernance.delete")}
          onClick={onDelete}
          hoverClassName="hover:text-red-500"
        />
      </div>
    </div>
  );
}

// Une carte de pôle de gouvernance : en-tête (voir PoleHeader) + son
// contenu, qui change selon "pole.kind" (voir mockData.js) :
// - "fixed"          : un seul poste, en avant (taille "lg"), non
//                      réassignable.
// - "assignable"      : une grille des postes nommés, chacun assignable.
// - "networkChapters" : un binôme par branche RÉELLE de Gestion du réseau
//                      (voir "chapters" ci-dessous, déjà calculé par
//                      Gouvernance/index.jsx) : "Leader Légende" reflète
//                      le responsable déjà assigné à cette branche
//                      (lecture seule — ça se change dans Gestion du
//                      réseau) et "Coordinateur" est assignable ici.
// - "autoLevel"       : la liste des membres ayant atteint "levelKey", ou
//                      un état vide explicite si personne n'y est encore
//                      — ce pôle n'a pas de bouton "+" : on y entre en
//                      progressant de niveau, pas par décision d'admin.
export function PoleSection({
  pole,
  number,
  Icon,
  onView,
  onAssign,
  autoLevelMembers,
  chapters,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7">
      <PoleHeader
        number={number}
        Icon={Icon}
        title={getPoleTitle(pole, t)}
        description={getPoleDescription(pole, t)}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <div className="mt-6">
        {pole.kind === "fixed" && (
          <div className="flex justify-center rounded-2xl bg-[#EE7115]/[0.06] py-6 sm:justify-start sm:pl-4">
            {pole.seats.map((seat) => (
              <SeatCard
                key={seat.id}
                size="lg"
                seatTitle={getSeatTitle(seat, t)}
                member={getMember(seat.memberId)}
                assignable={false}
                onView={() => onView(seat.memberId)}
              />
            ))}
          </div>
        )}

        {pole.kind === "assignable" &&
          (pole.seats.length > 0 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-6">
              {pole.seats.map((seat) => (
                <SeatCard
                  key={seat.id}
                  seatTitle={getSeatTitle(seat, t)}
                  member={seat.memberId ? getMember(seat.memberId) : null}
                  assignable
                  onView={() => onView(seat.memberId)}
                  onAssign={() => onAssign(pole.id, null, seat.id, getSeatTitle(seat, t))}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              {t("admin.gouvernance.poleForm.noSeats")}
            </p>
          ))}

        {pole.kind === "networkChapters" &&
          (chapters.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter) => (
                <div key={chapter.nodeId} className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm font-bold text-gray-800">{chapter.name}</p>
                  <p className="text-xs text-gray-400">{chapter.country}</p>
                  <div className="mt-4 flex justify-around gap-2">
                    <SeatCard
                      seatTitle={t("admin.gouvernance.seats.leaderLegende")}
                      member={chapter.leaderMemberId ? getMember(chapter.leaderMemberId) : null}
                      assignable={false}
                      onView={() => onView(chapter.leaderMemberId)}
                    />
                    <SeatCard
                      seatTitle={t("admin.gouvernance.seats.coordinateur")}
                      member={chapter.coordinatorMemberId ? getMember(chapter.coordinatorMemberId) : null}
                      assignable
                      onView={() => onView(chapter.coordinatorMemberId)}
                      onAssign={() =>
                        onAssign(
                          pole.id,
                          chapter.nodeId,
                          "coordinateur",
                          `${t("admin.gouvernance.seats.coordinateur")} · ${chapter.name}`,
                        )
                      }
                    />
                  </div>

                  {/* Tout ce qui est encore plus profond que cette région
                      (ex: une ville) reste dans la même carte plutôt que
                      d'ouvrir sa propre carte de chapitre — listé ici en
                      lecture seule, cliquable si un responsable y est déjà
                      assigné (voir Gestion du réseau pour l'assigner). */}
                  {chapter.subBranches.length > 0 && (
                    <div className="mt-4 border-t border-gray-50 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("admin.gouvernance.otherBranches")}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {chapter.subBranches.map((branch) => {
                          const member = branch.memberId ? getMember(branch.memberId) : null;
                          return (
                            <li key={branch.nodeId}>
                              <button
                                type="button"
                                onClick={() => onView(branch.memberId)}
                                disabled={!member}
                                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs disabled:cursor-default enabled:hover:bg-gray-50"
                              >
                                {member ? (
                                  <Avatar name={member.name} src={member.photo} size="size-6" />
                                ) : (
                                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 text-[9px] text-gray-300">
                                    ·
                                  </span>
                                )}
                                <span className="min-w-0 flex-1 truncate font-semibold text-gray-700">
                                  {branch.name}
                                </span>
                                <span className="shrink-0 text-gray-400">
                                  {member ? member.name : t("admin.reseau.vacant")}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              {t("admin.gouvernance.poles.antennes.empty")}
            </p>
          ))}

        {pole.kind === "autoLevel" &&
          (autoLevelMembers.length > 0 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-6">
              {autoLevelMembers.map((member) => (
                <SeatCard
                  key={member.id}
                  seatTitle={t(`simulateur.levels.${pole.levelKey}.name`)}
                  member={member}
                  assignable={false}
                  onView={() => onView(member.id)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              {t("admin.gouvernance.poles.legendes.empty")}
            </p>
          ))}
      </div>
    </section>
  );
}
