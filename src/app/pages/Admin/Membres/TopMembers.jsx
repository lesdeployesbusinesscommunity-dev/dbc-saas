// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { Avatar } from "../components/Avatar";
import { AwardBadge } from "./AwardBadge";

// ----------------------------------------------------------------------

// "Top des membres" (sous le tableau) : une carte par membre qui détient
// au moins un award, triées par nombre d'awards décroissant. Chaque carte
// reprend la photo, la ville et le domaine d'activité du membre — sa
// "carte de visite" — et ses awards sous forme de petits ronds avec icône
// (AwardBadge : au survol, popover avec l'icône + le nom de l'award).
export function TopMembers({ members }) {
  const { t } = useTranslation();

  const top = [...members]
    .filter((member) => member.awards?.length > 0)
    .sort((a, b) => (b.awards?.length ?? 0) - (a.awards?.length ?? 0));

  if (top.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold text-gray-900">{t("admin.membres.top.title")}</h2>
      <p className="text-xs text-gray-400">{t("admin.membres.top.subtitle")}</p>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {top.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm"
          >
            <Avatar name={member.name} size="size-16" className="mx-auto" />
            <p className="mt-3 truncate text-sm font-bold text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-400">{member.city}</p>
            <p className="mt-1.5 text-xs font-semibold text-gray-600">{member.domain}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {member.awards.map((key) => (
                <AwardBadge key={key} awardKey={key} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
