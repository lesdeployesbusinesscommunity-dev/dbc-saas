// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  LightBulbIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { DEADLINE_DAYS } from "./interviewModel";
import { LeaderShell } from "./LeaderShell";

// ----------------------------------------------------------------------

const SECTIONS = [
  { key: "before", Icon: FlagIcon, tone: "bg-[#52A2DF]/[0.12] text-[#52A2DF]" },
  { key: "during", Icon: ChatBubbleLeftRightIcon, tone: "bg-[#EE7115]/[0.12] text-[#EE7115]" },
  { key: "verify", Icon: MagnifyingGlassCircleIcon, tone: "bg-green-50 text-[#16A34A]" },
  { key: "after", Icon: ClipboardDocumentListIcon, tone: "bg-dbc-gold/[0.18] text-[#B8860B]" },
];

function GuideSection({ number, section }) {
  const { t } = useTranslation();
  const { key, Icon, tone } = section;
  const items = t(`membre.leader.guide.${key}.items`, { returnObjects: true, days: DEADLINE_DAYS });
  const list = Array.isArray(items) ? items : [];

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {t("membre.leader.guide.step", { n: number })}
          </p>
          <h2 className="text-base font-bold text-gray-900">{t(`membre.leader.guide.${key}.title`)}</h2>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600">{t(`membre.leader.guide.${key}.intro`, { days: DEADLINE_DAYS })}</p>
      <ul className="mt-3 space-y-2.5">
        {list.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
            <CheckBadgeIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#EE7115]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Le guide de l'entretien (/membre/leader/guide) : comment le préparer, le
// mener, quoi vérifier, et comment remplir le compte-rendu (qui ne demande
// que des cases à cocher).
export default function LeaderGuide() {
  const { t } = useTranslation();
  const tips = t("membre.leader.guide.tips.items", { returnObjects: true });

  return (
    <LeaderShell>
      <p className="max-w-3xl text-sm text-gray-600">{t("membre.leader.guide.subtitle")}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((section, index) => (
          <GuideSection key={section.key} number={index + 1} section={section} />
        ))}
      </div>

      <section className="mt-5 rounded-3xl bg-dbc-gold/[0.12] p-5 ring-1 ring-dbc-gold/30 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <LightBulbIcon aria-hidden="true" className="size-5 text-[#B8860B]" />
          {t("membre.leader.guide.tips.title")}
        </h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {(Array.isArray(tips) ? tips : []).map((tip) => (
            <li key={tip} className="rounded-xl bg-white/70 px-3.5 py-2.5 text-sm text-gray-700">
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </LeaderShell>
  );
}
