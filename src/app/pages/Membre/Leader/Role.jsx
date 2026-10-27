// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  HandRaisedIcon,
  LockClosedIcon,
  MegaphoneIcon,
  NoSymbolIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { DEADLINE_DAYS } from "./interviewModel";
import { LeaderShell } from "./LeaderShell";

// ----------------------------------------------------------------------

const RESPONSIBILITIES = [
  { key: "interviews", Icon: ClipboardDocumentCheckIcon, tone: "bg-[#52A2DF]/[0.12] text-[#52A2DF]" },
  { key: "welcome", Icon: HandRaisedIcon, tone: "bg-green-50 text-[#16A34A]" },
  { key: "animate", Icon: MegaphoneIcon, tone: "bg-[#EE7115]/[0.12] text-[#EE7115]" },
  { key: "sponsor", Icon: UserPlusIcon, tone: "bg-dbc-gold/[0.18] text-[#B8860B]" },
  { key: "followUp", Icon: BellAlertIcon, tone: "bg-red-50 text-red-600" },
  { key: "confidential", Icon: LockClosedIcon, tone: "bg-gray-100 text-gray-600" },
];

// "Mon rôle" (/membre/leader/role) : ce que la DBC attend d'un leader
// d'antenne, et ce qu'il ne fait pas.
export default function LeaderRole() {
  const { t } = useTranslation();
  const donts = t("membre.leader.role.donts.items", { returnObjects: true });

  return (
    <LeaderShell>
      <p className="max-w-3xl text-sm text-gray-600">{t("membre.leader.role.subtitle")}</p>

      <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {RESPONSIBILITIES.map(({ key, Icon, tone }) => (
          <li key={key} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <span className={`flex size-10 items-center justify-center rounded-full ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold text-gray-900">{t(`membre.leader.role.items.${key}.title`)}</h2>
            <p className="mt-1.5 text-sm text-gray-600">
              {t(`membre.leader.role.items.${key}.text`, { days: DEADLINE_DAYS })}
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <NoSymbolIcon aria-hidden="true" className="size-5 text-red-500" />
          {t("membre.leader.role.donts.title")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          {(Array.isArray(donts) ? donts : []).map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-red-400" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </LeaderShell>
  );
}
