// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { LevelSwitcherBadge } from "../components/LevelSwitcherBadge";
import { SearchEmpty } from "../components/SearchEmpty";
import { useReportMatches, useSearchSummary } from "../components/searchSummary";
import { useMemberLevel } from "../context/MemberLevelContext";
import { formationDomains, getDomain } from "./domains";
import { getCourseCatalog, getLockedCatalog } from "./mockData";
import { courseMatches } from "./searchFilter";
import { getCourseProgress, isCourseRewarded, useProgressState, useRewards } from "./progressStore";
import { ContinueLearning } from "./ContinueLearning";
import { FormationFilters } from "./FormationFilters";
import { TrainingCard } from "./TrainingCard";
import { LockedTrainings } from "./LockedTrainings";

// ----------------------------------------------------------------------

// Page "Formation" (/membre/formation) : le catalogue d'apprentissage du
// membre. Quatre idées :
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
//
// La recherche de l'en-tête (nom de formation, formateur, domaine ou niveau)
// filtre le catalogue ET les formations verrouillées ; les compteurs des
// filtres suivent la recherche. Le bandeau "Reprendre" ne bouge pas : il
// parle de la progression du membre, pas du catalogue qu'il parcourt.
export default function MembreFormation() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const progressState = useProgressState();
  const rewards = useRewards();
  const [domain, setDomain] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const items = getCourseCatalog(activeLevelKey).map((course) => ({
    course,
    progress: getCourseProgress(course, progressState),
  }));
  const searched = items.filter((item) => courseMatches(item.course, query, t));
  const lockedMatches = getLockedCatalog(currentMember.levelKeys).reduce(
    (sum, group) => sum + group.courses.filter((course) => courseMatches(course, query, t)).length,
    0,
  );

  // Deux "sections" pour le message de recherche de la page : le catalogue
  // du niveau et les formations verrouillées (voir searchSummary.js). Le
  // catalogue compte selon la recherche seule, pas selon les filtres.
  const { report, noResults } = useSearchSummary(query);
  useReportMatches(report, "catalog", searched.length);
  useReportMatches(report, "locked", lockedMatches);

  // Domaines présents dans CE niveau, dans l'ordre de domains.js.
  const domainCounts = formationDomains
    .map(({ key }) => ({ key, count: searched.filter((item) => item.course.domainKey === key).length }))
    .filter(({ count }) => count > 0);

  // Si le niveau change et que le domaine choisi n'y existe plus, on
  // retombe sur "Tous" au lieu d'afficher une liste vide.
  const activeDomain = domain === "all" || domainCounts.some(({ key }) => key === domain) ? domain : "all";

  const visible = searched.filter(
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
        <TopBar
          titleKey="membre.nav.formation"
          titleExtra={<LevelSwitcherBadge />}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("membre.formation.searchPlaceholder")}
        />
        {noResults && <SearchEmpty query={query} className="mt-8" />}
        <ContinueLearning items={items} />

        {items.length > 0 && searched.length > 0 && (
          <FormationFilters
            domainCounts={domainCounts}
            total={searched.length}
            domain={activeDomain}
            onDomainChange={setDomain}
            status={status}
            onStatusChange={setStatus}
          />
        )}

        {searched.length > 0 && groups.length === 0 && (
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

        <LockedTrainings query={query} />
      </div>
    </Page>
  );
}
