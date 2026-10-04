// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { longrichPacks } from "app/pages/Admin/Piliers/mockData";

// ----------------------------------------------------------------------

// "Packs Longrich — Détail PV" : le tableau des 6 packs avec leur prix,
// leurs PV et le niveau DBC auquel chacun donne accès. Affiché sur la
// page du pilier "Business MLM Longrich" (voir PillarPage.jsx) ; les
// données viennent de Admin/Piliers/mockData.js.
export function LongrichPacksTable() {
  const { t } = useTranslation();

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">{t("piliers.packs.title")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-bold uppercase tracking-wide text-gray-400">
              <th scope="col" className="py-2 pr-4">{t("piliers.packs.pack")}</th>
              <th scope="col" className="py-2 pr-4">{t("piliers.packs.price")}</th>
              <th scope="col" className="py-2 pr-4">{t("piliers.packs.pv")}</th>
              <th scope="col" className="py-2">{t("piliers.packs.level")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {longrichPacks.map((row) => (
              <tr key={row.pack}>
                <td className="py-3 pr-4 font-bold text-gray-900">{formatMoney(row.pack)}</td>
                <td className="py-3 pr-4 text-gray-700">{formatMoney(row.price)}</td>
                <td className="py-3 pr-4 text-gray-700">{t("piliers.packs.pvValue", { count: row.pv })}</td>
                <td className="py-3 text-gray-700">{t(`simulateur.levels.${row.levelKey}.name`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
