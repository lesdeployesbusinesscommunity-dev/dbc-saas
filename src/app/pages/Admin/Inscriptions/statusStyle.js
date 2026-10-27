// Couleurs de chaque état d'une demande d'inscription, écrites en toutes
// lettres (Tailwind ne génère que les classes présentes telles quelles).
// "tab" : l'onglet du dossier ; "border" : le liseré en haut de la carte ;
// "badge" : la pastille d'état.
export const STATUS_STYLE = {
  nouvelle: {
    tab: "bg-[#EE7115]",
    border: "border-t-[#EE7115]",
    badge: "bg-orange-50 text-[#EE7115] ring-[#EE7115]/25",
    dot: "bg-[#EE7115]",
  },
  entretien: {
    tab: "bg-[#52A2DF]",
    border: "border-t-[#52A2DF]",
    badge: "bg-blue-50 text-[#2f78b0] ring-[#52A2DF]/30",
    dot: "bg-[#52A2DF]",
  },
  acceptee: {
    tab: "bg-green-600",
    border: "border-t-green-600",
    badge: "bg-green-50 text-green-700 ring-green-600/25",
    dot: "bg-green-600",
  },
  refusee: {
    tab: "bg-gray-400",
    border: "border-t-gray-300",
    badge: "bg-gray-100 text-gray-600 ring-gray-400/30",
    dot: "bg-gray-400",
  },
};
