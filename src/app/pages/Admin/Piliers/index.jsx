// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { Select } from "../Parametres/Field";
import { Toggle } from "../Parametres/Toggle";
import { normalizeSearchText } from "../searchUtils";
import { groupStyles } from "app/pages/Membre/Piliers/pillarStyles";
import { pillarGroups, pillarStatuses } from "./mockData";
import { addPillar, getPillarText, newPillarDraft, removePillar, updatePillar, usePillars } from "./pillarsStore";
import { PillarEditModal } from "./PillarEditModal";

// ----------------------------------------------------------------------

// Page "Piliers" de l'admin (/admin/piliers), après Formation : les 4
// piliers de la DBC — 01 FINANCER, 02 FORMER, 03 RÉSEAUTER, 04 INVESTIR —
// chacun avec ses 6 programmes (ses sous-ensembles), tels que les membres
// les voient sur leur page Piliers (voir Membre/Piliers). Chaque pilier est
// une carte qui se déplie : l'admin y règle, pour chaque programme, son
// statut (actif, bientôt, projet), s'il est visible des membres, et — via
// "Modifier" — son résumé et, pour ceux qui ont leur propre page, son
// explication. Le statut et la visibilité s'appliquent tout de suite
// (comme les Paramètres admin). Le bouton "Ajouter un programme" crée un
// nouveau programme dans l'un des 4 piliers (nom, résumé, explication
// libres) ; ceux-là peuvent aussi être supprimés. Tout passe par
// pillarsStore.js, en local
// pour l'instant en attendant les vrais endpoints.
export default function AdminPiliers() {
  const { t } = useTranslation();
  const pillars = usePillars();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  // Brouillon d'un programme en cours d'ajout (fenêtre "Ajouter un programme").
  const [draft, setDraft] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);

  const editing = draft ?? pillars.find((pillar) => pillar.id === editingId) ?? null;

  const stats = useMemo(
    () => ({
      groups: pillarGroups.length,
      programs: pillars.length,
      visible: pillars.filter((pillar) => pillar.visible).length,
      notActive: pillars.filter((pillar) => pillar.status !== "active").length,
    }),
    [pillars],
  );

  const query = normalizeSearchText(search);
  const matches = (pillar) => {
    if (!query) return true;
    const text = getPillarText(pillar, t);
    return (
      normalizeSearchText(text.name).includes(query) || normalizeSearchText(text.summary).includes(query)
    );
  };

  const statusOptions = pillarStatuses.map((value) => ({ value, label: t(`piliers.status.${value}`) }));
  const toggleOpen = (key) =>
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((entry) => entry !== key) : [...prev, key]));

  const visibleGroups = pillarGroups.filter(
    (group) => !query || pillars.some((pillar) => pillar.group === group.key && matches(pillar)),
  );

  return (
    <Page title={`Admin – ${t("admin.piliers.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.piliers.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.piliers.searchPlaceholder")}
        />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-3xl text-sm text-gray-600">{t("admin.piliers.intro")}</p>
          <button
            type="button"
            // Le nouveau programme est proposé dans le dernier pilier ouvert.
            onClick={() => setDraft(newPillarDraft(openKeys.at(-1) ?? pillarGroups[0].key))}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {t("admin.piliers.add")}
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["groups", stats.groups],
            ["programs", stats.programs],
            ["visible", stats.visible],
            ["notActive", stats.notActive],
          ].map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <dd className="text-xl font-bold text-gray-900">{value}</dd>
              <dt className="mt-0.5 text-xs text-gray-500">{t(`admin.piliers.stats.${key}`)}</dt>
            </div>
          ))}
        </dl>

        {visibleGroups.length === 0 && (
          <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            {t("admin.piliers.noResults", { query: search.trim() })}
          </p>
        )}

        <div className="mt-6 space-y-5">
          {visibleGroups.map((group) => {
            const style = groupStyles[group.key];
            const GroupIcon = group.Icon;
            const all = pillars.filter((pillar) => pillar.group === group.key);
            const items = all.filter(matches);
            const visibleCount = all.filter((pillar) => pillar.visible).length;
            const title = t(`membre.piliers.groups.${group.key}.title`);
            // Une recherche ouvre d'office les piliers qui ont une réponse.
            const open = query ? true : openKeys.includes(group.key);
            const panelId = `pillar-panel-${group.key}`;

            return (
              <section key={group.key} className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
                <div aria-hidden="true" className={clsx("absolute inset-x-0 top-0 h-1", style.barClass)} />

                <button
                  type="button"
                  onClick={() => toggleOpen(group.key)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex w-full items-start gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#52A2DF] sm:p-6"
                >
                  <span className={clsx("flex size-12 shrink-0 items-center justify-center rounded-2xl", style.iconBoxClass)}>
                    <GroupIcon aria-hidden="true" className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={clsx("block text-sm font-bold uppercase tracking-[0.15em]", style.textClass)}>
                      {group.number} · {title}
                    </span>
                    <span className="mt-1 block text-sm italic text-gray-500">
                      {t(`membre.piliers.groups.${group.key}.quote`)}
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-gray-500">
                      {t("admin.piliers.programsCount", { count: all.length })} ·{" "}
                      {t("admin.piliers.visibleCount", { visible: visibleCount, total: all.length })}
                    </span>
                    {!open && (
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {all.map((pillar) => (
                          <span
                            key={pillar.id}
                            className={clsx(
                              "rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600",
                              !pillar.visible && "line-through opacity-60",
                            )}
                          >
                            {getPillarText(pillar, t).name}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={clsx("mt-1 size-5 shrink-0 text-gray-400 transition-transform", open && "rotate-180")}
                  />
                </button>

                {open && (
                  <div id={panelId} className="border-t border-black/5 bg-gray-50/50 p-4 sm:p-5">
                    <ul className="space-y-3">
                      {items.map((pillar) => {
                        const text = getPillarText(pillar, t);
                        const Icon = pillar.Icon;
                        const customized = !pillar.custom && Boolean(pillar.summary || pillar.overview);

                        return (
                          <li
                            key={pillar.id}
                            className={clsx(
                              "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5",
                              !pillar.visible && "opacity-70",
                            )}
                          >
                            <span className={clsx("flex size-11 shrink-0 items-center justify-center rounded-2xl", style.iconBoxClass)}>
                              <Icon aria-hidden="true" className="size-6" />
                            </span>

                            <div className="min-w-0 flex-1 basis-60">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-900">
                                {text.name}
                                {text.tag && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                    {text.tag}
                                  </span>
                                )}
                                {pillar.custom && (
                                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                    {t("admin.piliers.added")}
                                  </span>
                                )}
                                {customized && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    {t("admin.piliers.customized")}
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">{text.summary}</p>
                            </div>

                            <div className="w-36 shrink-0">
                              <Select
                                aria-label={`${text.name} — ${t("admin.piliers.modal.status")}`}
                                value={pillar.status}
                                onChange={(event) => updatePillar(pillar.id, { status: event.target.value })}
                                options={statusOptions}
                              />
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <Toggle
                                checked={pillar.visible}
                                onChange={(value) => updatePillar(pillar.id, { visible: value })}
                                label={`${text.name} — ${t("admin.piliers.modal.visible")}`}
                              />
                              <span className="w-14 text-xs font-semibold text-gray-500">
                                {t(pillar.visible ? "admin.piliers.visibleOn" : "admin.piliers.visibleOff")}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setEditingId(pillar.id)}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <PencilSquareIcon aria-hidden="true" className="size-4" />
                              {t("admin.piliers.edit")}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <PillarEditModal
        pillar={editing}
        open={!!editing}
        onClose={() => {
          setEditingId(null);
          setDraft(null);
        }}
        onSave={(id, patch) => {
          if (id) {
            updatePillar(id, patch);
            return;
          }
          // Création : on ouvre le pilier qui reçoit le nouveau programme.
          addPillar(patch);
          setOpenKeys((prev) => (prev.includes(patch.group) ? prev : [...prev, patch.group]));
        }}
        onResetTexts={(id) => updatePillar(id, { summary: "", overview: "" })}
        onDelete={removePillar}
      />
    </Page>
  );
}
