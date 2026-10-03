// Import Dependencies
import { useTranslation } from "react-i18next";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// "Comment fonctionne la tontine ?" : un petit bloc dépliable, repliè par
// défaut, placé juste après la légende des statuts — pour les nouveaux
// membres qui découvrent le principe, sans alourdir la page pour ceux qui
// le connaissent déjà (contrairement à la légende, affichée en clair en
// permanence, demandée explicitement comme prioritaire par rapport au
// cycle des 12 mois).
export function TontineFaq() {
  const { t } = useTranslation();
  const items = t("membre.tontine.faq.items", { returnObjects: true });

  return (
    <div className="mt-4 rounded-2xl border border-black/5 bg-white shadow-sm">
      <Disclosure>
        {({ open }) => (
          <>
            <DisclosureButton className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
              <span className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                <QuestionMarkCircleIcon aria-hidden="true" className="size-5 shrink-0 text-[#52A2DF]" />
                {t("membre.tontine.faq.title")}
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </DisclosureButton>
            <DisclosurePanel className="space-y-4 px-5 pb-5">
              {items.map((item) => (
                <div key={item.question}>
                  <p className="text-sm font-semibold text-gray-900">{item.question}</p>
                  <p className="mt-1 text-sm leading-snug text-gray-500">{item.answer}</p>
                </div>
              ))}
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
