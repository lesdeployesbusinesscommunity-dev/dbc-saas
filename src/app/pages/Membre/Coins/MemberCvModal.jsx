// Import Dependencies
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  TrophyIcon,
  BriefcaseIcon,
  LinkIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { StatusBadge } from "app/pages/Admin/Membres/StatusBadge";
import { LEVEL_HEX, getInitials } from "../communityMembers";
import { whatsappLink, telLink } from "../Reseau/contactLinks";

// ----------------------------------------------------------------------

// Fiche "CV" d'un membre de la communauté, ouverte depuis le classement
// (CoinsLeaderboard.jsx) ET depuis "Mon Réseau" (Reseau/NetworkTree.jsx) :
// une version allégée de "Voir" côté admin (Admin/Membres/
// MemberDetailsCard.jsx) — même esquisse (Dialog Headless UI, avatar + nom
// en tête, tuiles de chiffres clés, informations secondaires en encadré),
// mais sans les champs propres à la gestion interne (matricule, parrain,
// formations, filleuls...) qui n'ont pas leur place dans un profil
// communautaire. Les champs "rank" et "relationLabel" sont optionnels :
// "rank" n'existe que si l'appelant est le classement (déjà calculé
// là-bas), "relationLabel" (ex: "Mon parrain") que si l'appelant est "Mon
// Réseau" — la tuile ou la pastille correspondante n'apparaît alors que
// dans ce cas.
//
// "showContact" (booléen, vrai seulement depuis "Mon Réseau") ajoute les
// boutons "Appeler" et "WhatsApp" : on joint ses parrains et filleuls, pas
// n'importe quel membre du classement — le numéro d'un membre n'a pas à
// être à un clic de toute la communauté. WhatsApp ouvre une conversation
// avec un message pré-rempli que la personne envoie (ou non) elle-même ;
// sans numéro connu, les boutons ne s'affichent pas.
function InfoRow({ Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </dt>
      <dd className="text-right font-semibold text-gray-800">{value}</dd>
    </div>
  );
}

export function MemberCvModal({ member, open, onClose, relationLabel, showContact = false }) {
  const { t } = useTranslation();

  if (!member) return null;

  const level = levels.find((l) => l.key === member.levelKey);
  const Icon = level?.Icon;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: LEVEL_HEX[member.levelKey] }}
              >
                {getInitials(member.name)}
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {member.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">{member.role}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                      level?.borderClass,
                      level?.textClass,
                      level?.bgTintClass,
                    )}
                  >
                    {Icon && <Icon aria-hidden="true" className="size-3" />}
                    {t(`simulateur.levels.${member.levelKey}.name`)}
                  </span>
                  {member.status && <StatusBadge status={member.status} />}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("membre.common.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="p-6">
            {relationLabel && (
              <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#52A2DF]/[0.08] px-3 py-2 text-sm font-semibold text-[#2f78b4]">
                <LinkIcon aria-hidden="true" className="size-4 shrink-0" />
                {relationLabel}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-amber-50 p-4">
                <CircleStackIcon aria-hidden="true" className="size-5 text-amber-500" />
                <p className="mt-2 text-lg font-bold text-gray-900">{member.coins}</p>
                <p className="text-xs font-medium text-gray-500">
                  {t("membre.coins.leaderboard.cv.coinsLabel")}
                </p>
              </div>
              {member.rank != null && (
                <div className="rounded-xl bg-blue-50 p-4">
                  <TrophyIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
                  <p className="mt-2 text-lg font-bold text-gray-900">#{member.rank}</p>
                  <p className="text-xs font-medium text-gray-500">
                    {t("membre.coins.leaderboard.cv.rankTile")}
                  </p>
                </div>
              )}
            </div>

            <dl className="mt-4 divide-y divide-gray-50 rounded-xl border border-gray-100 p-4">
              {member.sector && (
                <InfoRow
                  Icon={BriefcaseIcon}
                  label={t("membre.coins.leaderboard.cv.sector")}
                  value={member.sector}
                />
              )}
              <InfoRow Icon={MapPinIcon} label={t("membre.coins.leaderboard.cv.city")} value={member.city} />
              <InfoRow
                Icon={CalendarDaysIcon}
                label={t("membre.coins.leaderboard.cv.memberSince")}
                value={member.memberSinceYear}
              />
            </dl>

            {showContact && member.phone && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <a
                  href={telLink(member.phone)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <PhoneIcon aria-hidden="true" className="size-4" />
                  {t("membre.reseau.contact.call")}
                </a>
                <a
                  href={whatsappLink(member.phone, t("membre.reseau.contact.message", { name: member.name }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <ChatBubbleLeftRightIcon aria-hidden="true" className="size-4" />
                  {t("membre.reseau.contact.whatsapp")}
                </a>
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
