// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  MegaphoneIcon,
  UserPlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
  GiftIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney, levels } from "app/pages/Simulateur/data";
import { getMlmStats, getMyPack } from "./mockData";

// ----------------------------------------------------------------------

// "Mon arbre" : la carte de synthèse du partenariat Longrich — 4
// indicateurs clés (filleuls directs, taille du réseau, volume personnel,
// commissions du mois) puis le pack Longrich actuel du membre, qui donne
// accès à des paliers de commission (système séparé des niveaux DBC/
// tontine, voir mockData.js). Sobre et sans dégradé, contrairement à la
// cagnotte de "Ma Tontine" (voir Tontine/CagnotteHero.jsx) : pas demandé
// ici, et garde un repère visuel clair entre les deux pages plutôt que de
// réutiliser le même traitement partout.
export function MlmOverview() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const stats = getMlmStats();
  const pack = getMyPack();
  const eligibleLevel = levels.find((l) => l.key === pack.eligibleLevelKey);
  const eligibleLevelPosition = levels.findIndex((l) => l.key === pack.eligibleLevelKey) + 1;

  const tiles = [
    {
      key: "directReferrals",
      labelKey: "membre.mlm.stats.directReferrals",
      value: stats.directReferrals,
      Icon: UserPlusIcon,
      color: "#52A2DF",
    },
    {
      key: "totalNetwork",
      labelKey: "membre.mlm.stats.totalNetwork",
      labelOptions: { levels: stats.networkLevels },
      value: stats.totalNetwork,
      Icon: UserGroupIcon,
      color: "#4F46E5",
    },
    {
      key: "personalVolume",
      labelKey: "membre.mlm.stats.personalVolume",
      value: `${stats.personalVolume} PV`,
      Icon: ChartBarIcon,
      color: "#16A34A",
    },
    {
      key: "monthlyCommissions",
      labelKey: "membre.mlm.stats.monthlyCommissions",
      value: formatMoney(stats.monthlyCommissions, locale),
      Icon: BanknotesIcon,
      color: "#EE7115",
    },
  ];

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <MegaphoneIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
        {t("membre.mlm.overviewTitle")}
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map(({ key, labelKey, labelOptions, value, Icon, color }) => (
          <div key={key} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-3 text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{t(labelKey, labelOptions)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-black/5 bg-gray-50 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/[0.1] text-[#EE7115]">
            <GiftIcon aria-hidden="true" className="size-4" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {t("membre.mlm.pack.title")}
          </p>
        </div>
        <p className="mt-3 text-lg font-bold text-gray-900">
          {t("membre.mlm.pack.summary", {
            name: pack.name,
            price: formatMoney(pack.price, locale),
            pv: pack.pv,
          })}
        </p>
        {eligibleLevel && (
          <p className="mt-1 text-xs text-gray-500">
            {t("membre.mlm.pack.accessLabel")}
            {" · "}
            {t("membre.mlm.pack.eligible", {
              level: t(`simulateur.levels.${eligibleLevel.key}.name`),
              n: eligibleLevelPosition,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
