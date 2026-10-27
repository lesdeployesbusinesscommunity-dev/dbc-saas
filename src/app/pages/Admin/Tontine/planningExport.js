// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { downloadCsv } from "./registreUtils";

// ----------------------------------------------------------------------
// Export du planning des bénéficiaires en CSV (séparateur ";" et BOM UTF-8,
// donc le fichier s'ouvre directement dans Excel, accents compris). Deux
// présentations, sur les groupes que l'administration a sous les yeux
// (niveau et recherche déjà appliqués) :
//   - "list" : une ligne par bénéficiaire, avec tout le cycle de chaque
//     groupe (les 12 mois, pas seulement ceux visibles à l'écran) ;
//   - "grid" : comme l'écran, une ligne par groupe et une colonne par mois,
//     avec les bénéficiaires du mois dans chaque case.
// "t" et "month" viennent de useTontineFormat : le fichier suit la langue
// de l'interface.

const KEY = "admin.tontine.export";

function listRows({ groups, t, month }) {
  const header = [
    t(`${KEY}.columns.level`),
    t(`${KEY}.columns.group`),
    t(`${KEY}.columns.tour`),
    t(`${KEY}.columns.month`),
    t(`${KEY}.columns.beneficiary`),
    t(`${KEY}.columns.city`),
    t(`${KEY}.columns.payout`),
    t(`${KEY}.columns.status`),
  ];

  const rows = groups.flatMap((group) => {
    const level = t(`simulateur.levels.${group.levelKey}.name`);
    const name = t("admin.tontine.group", { letter: group.letter });
    const cityOf = new Map(group.members.map((member) => [member.id, member.city]));

    return group.schedule.flatMap((slot) => {
      const common = [level, name, slot.tour, month(slot.month)];
      const status = t(`${KEY}.status.${slot.status}`);
      const people = slot.members.map((member) => [
        ...common,
        member.name,
        cityOf.get(member.id) ?? "",
        group.payout.amount,
        status,
      ]);
      // Une place encore libre est une ligne : l'administration voit ce qu'il reste à pourvoir.
      const open = Array.from({ length: slot.openSlots }, () => [...common, t(`${KEY}.free`), "", "", status]);
      return [...people, ...open];
    });
  });

  return [header, ...rows];
}

function gridRows({ groups, t, month }) {
  if (groups.length === 0) return [[t(`${KEY}.columns.level`), t(`${KEY}.columns.group`)]];

  const first = groups.reduce((min, group) => (group.startMonth.isBefore(min) ? group.startMonth : min), groups[0].startMonth);
  const last = groups.reduce((max, group) => (group.endMonth.isAfter(max) ? group.endMonth : max), groups[0].endMonth);
  const months = Array.from({ length: last.diff(first, "month") + 1 }, (_unused, i) => first.add(i, "month"));

  const header = [t(`${KEY}.columns.level`), t(`${KEY}.columns.group`), ...months.map((m) => month(m))];
  const rows = groups.map((group) => [
    t(`simulateur.levels.${group.levelKey}.name`),
    t("admin.tontine.group", { letter: group.letter }),
    ...months.map((m) => {
      const slot = group.schedule.find((entry) => entry.month.isSame(m, "month"));
      if (!slot) return "";
      if (slot.free) return t("admin.tontine.free");
      const names = slot.members.map((member) => member.name);
      return slot.openSlots > 0 ? [...names, t("admin.tontine.openSlots", { count: slot.openSlots })].join(" / ") : names.join(" / ");
    }),
  ]);

  return [header, ...rows];
}

export function exportPlanning(kind, { groups, t, month }) {
  const rows = kind === "grid" ? gridRows({ groups, t, month }) : listRows({ groups, t, month });
  downloadCsv(`planning-beneficiaires-${kind}-${dayjs().format("YYYY-MM-DD")}.csv`, rows);
  return rows.length - 1;
}
