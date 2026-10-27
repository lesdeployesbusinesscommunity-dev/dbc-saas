// Import Dependencies
import { PlusIcon, UserPlusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "./LevelBadge";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

// Les membres déjà inscrits à un niveau mais qui n'ont pas encore de mois de
// passage. Ils n'ont pas à attendre d'être nombreux : pour chaque niveau,
// l'administration peut les placer tout de suite sur un mois libre d'un groupe
// ouvert (s'il y en a), ou ouvrir un nouveau groupe, même avec quelques
// membres seulement.
export function WaitingMembers({ entries, openGroups = [], onCreateGroup, onOpenGroup }) {
  const { t } = useTontineFormat();

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <UserPlusIcon aria-hidden="true" className="size-4 text-gray-400" />
        {t("admin.tontine.waiting.title")}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.waiting.hint")}</p>

      {entries.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-gray-500">{t("admin.tontine.waiting.empty")}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {entries.map((entry) => (
            <div key={entry.levelKey} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LevelBadge levelKey={entry.levelKey} />
                <div className="flex flex-wrap items-center gap-2">
                  {openGroups
                    .filter((group) => group.levelKey === entry.levelKey)
                    .map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => onOpenGroup(group.id)}
                        className="rounded-lg border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        {t("admin.tontine.waiting.placeIn", { letter: group.letter, count: group.freeSlots.reduce((sum, slot) => sum + slot.openSlots, 0) })}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => onCreateGroup(entry.levelKey)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#52A2DF] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <PlusIcon aria-hidden="true" className="size-4" />
                    {t("admin.tontine.waiting.createGroup")}
                  </button>
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {entry.members.map((member) => (
                  <li key={member.id} className="flex items-center gap-2.5">
                    <Avatar name={member.name} size="size-8" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{member.name}</p>
                      <p className="truncate text-xs text-gray-400">
                        {member.city} · {t("admin.tontine.waiting.since", { count: member.waitingDays })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
