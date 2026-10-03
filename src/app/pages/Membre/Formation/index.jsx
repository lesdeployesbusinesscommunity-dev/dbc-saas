// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { LevelSwitcherBadge } from "../components/LevelSwitcherBadge";
import { useMemberLevel } from "../context/MemberLevelContext";
import { formationDomains, getDomain } from "./domains";
import { getCourseCatalog } from "./mockData";
import { getCourseProgress, isCourseRewarded, useProgressState, useRewards } from "./progressStore";
import { ContinueLearning } from "./ContinueLearning";
import { FormationFilters } from "./FormationFilters";
import { TrainingCard } from "./TrainingCard";
import { LockedTrainings } from "./LockedTrainings";

// ----------------------------------------------------------------------

// Page "Formation" (/membre/formation) : le catalogue d'apprentissage du
// membre. Trois idées :
// - elle dépend du NIVEAU consulté (badge à côté du titre, même mécanisme
//   que Ma Tontine : voir MemberLevelContext) — chaque niveau a ses
//   formations ;
// - elle est CLASSÉE PAR DOMAINE (Vente, Leadership, Finance...), avec des
//   filtres par domaine et par statut (voir FormationFilters.jsx) ;
// - chaque carte mène à la formation elle-même (CoursePage.jsx) : chapitres,
//   vidéos, et un pourcentage qui monte au fil des leçons terminées.
// Le bandeau du haut (ContinueLearning.jsx) propose de reprendre là où le
// membre s'était arrêté ; tout en bas, les formations des niveaux qu'il n'a
// pas encore sont montrées verrouillées (LockedTrainings.jsx).
export default function MembreFormation() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const progressState = useProgressState();
  const rewards = useRewards();
  const [domain, setDomain] = useState("all");
  const [status, setStatus] = useState("all");

  const items = getCourseCatalog(activeLevelKey).map((course) => ({
    course,
    progress: getCourseProgress(course, progressState),
  }));

  // Domaines présents dans CE niveau, dans l'ordre de domains.js.
  const domainCounts = formationDomains
    .map(({ key }) => ({ key, count: items.filter((item) => item.course.domainKey === key).length }))
    .filter(({ count }) => count > 0);

  // Si le niveau change et que le domaine choisi n'y existe plus, on
  // retombe sur "Tous" au lieu d'afficher une liste vide.
  const activeDomain = domain === "all" || domainCounts.some(({ key }) => key === domain) ? domain : "all";

  const visible = items.filter(
    (item) =>
      (activeDomain === "all" || item.course.domainKey === activeDomain) &&
      (status === "all" || item.progress.status === status),
  );
  const groups = domainCounts
    .map(({ key }) => ({ key, items: visible.filter((item) => item.course.domainKey === key) }))
    .filter((group) => group.items.length > 0);

  return (
    <Page title={`${t("membre.nav.formation")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar titleKey="membre.nav.formation" titleExtra={<LevelSwitcherBadge />} />
        <ContinueLearning items={items} />

        {items.length > 0 && (
          <FormationFilters
            domainCounts={domainCounts}
            total={items.length}
            domain={activeDomain}
            onDomainChange={setDomain}
            status={status}
            onStatusChange={setStatus}
          />
        )}

        {items.length > 0 && groups.length === 0 && (
          <p className="mt-8 rounded-3xl border border-black/5 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            {t("membre.formation.emptyFilter")}
          </p>
        )}

        {groups.map((group) => {
          const { Icon } = getDomain(group.key);
          return (
            <section key={group.key} className="mt-8">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Icon aria-hidden="true" className="size-5 text-[#EE7115]" />
                {t(`membre.formation.domains.${group.key}`)}
                <span className="text-xs font-semibold text-gray-400">{group.items.length}</span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map(({ course, progress }) => (
                  <TrainingCard
                    key={course.id}
                    course={course}
                    progress={progress}
                    rewarded={isCourseRewarded(course, rewards)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <LockedTrainings />
      </div>
    </Page>
  );
}
