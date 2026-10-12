// ----------------------------------------------------------------------
// Couleurs des quatre piliers et des statuts. Classes Tailwind écrites en
// toutes lettres : Tailwind ne voit pas les classes construites à
// l'exécution. Partagé par la page membre (Piliers) et la page admin
// (Admin/Piliers) pour que les deux montrent la même chose. Les icônes
// des piliers sont dans Admin/Piliers/mockData.js ("pillarGroups").
//
// "iconBoxClass" : pastille d'icône ; "badgeClass" : étiquette "01 ·
// FINANCER" ; "textClass" : titres et liens d'accent ; "bulletClass" : la
// puce ▶ de la liste ; "barClass" : liseré en haut de la carte.
export const groupStyles = {
  financer: {
    iconBoxClass: "bg-[#52A2DF]/10 text-[#2E70B8]",
    badgeClass: "bg-[#52A2DF]/10 text-[#2E70B8]",
    textClass: "text-[#2E70B8]",
    bulletClass: "text-[#52A2DF]",
    barClass: "bg-[#52A2DF]",
    ctaClass: "bg-[#52A2DF]/10 text-[#2E70B8] hover:bg-[#52A2DF]/20",
  },
  former: {
    iconBoxClass: "bg-[#EE7115]/10 text-[#EE7115]",
    badgeClass: "bg-[#EE7115]/10 text-[#C2570C]",
    textClass: "text-[#C2570C]",
    bulletClass: "text-[#EE7115]",
    barClass: "bg-[#EE7115]",
    ctaClass: "bg-[#EE7115]/10 text-[#C2570C] hover:bg-[#EE7115]/20",
  },
  reseauter: {
    iconBoxClass: "bg-[#16A34A]/10 text-[#15803D]",
    badgeClass: "bg-[#16A34A]/10 text-[#15803D]",
    textClass: "text-[#15803D]",
    bulletClass: "text-[#16A34A]",
    barClass: "bg-[#16A34A]",
    ctaClass: "bg-[#16A34A]/10 text-[#15803D] hover:bg-[#16A34A]/20",
  },
  investir: {
    iconBoxClass: "bg-[#7C3AED]/10 text-[#6D28D9]",
    badgeClass: "bg-[#7C3AED]/10 text-[#6D28D9]",
    textClass: "text-[#6D28D9]",
    bulletClass: "text-[#7C3AED]",
    barClass: "bg-[#7C3AED]",
    ctaClass: "bg-[#7C3AED]/10 text-[#6D28D9] hover:bg-[#7C3AED]/20",
  },
};

export const statusStyles = {
  active: "bg-green-50 text-green-700",
  soon: "bg-blue-50 text-blue-700",
  project: "bg-amber-50 text-amber-700",
};
