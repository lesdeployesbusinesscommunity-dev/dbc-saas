// Import Dependencies
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, ExclamationTriangleIcon, FolderOpenIcon, XMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { useNetworkData } from "../context/NetworkDataContext";
import { AddMemberModal } from "../Membres/AddMemberModal";
import { ConfirmDialog } from "../Membres/ConfirmDialog";
import { levelNumbers } from "../Membres/mockData";
import {
  createMember,
  listMembers,
  suggestMatricule,
  useMembersStore,
} from "../Membres/membersStore";
import { normalizeSearchText } from "../searchUtils";
import { AssignLeaderModal } from "./AssignLeaderModal";
import { DossierCard } from "./DossierCard";
import { DossierCV } from "./DossierCV";
import { fullName, memberPrefillFrom } from "./registrationUtils";
import {
  REGISTRATION_STATUSES,
  assignRegistration,
  markRegistrationAccepted,
  refuseRegistration,
  useRegistrations,
} from "./registrationsStore";
import { STATUS_STYLE } from "./statusStyle";
import { deadlineState, interviewStage } from "app/pages/Membre/Leader/interviewModel";

// ----------------------------------------------------------------------

const SELECT =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#52A2DF]";

// Page "Demandes d'inscription" (/admin/inscriptions). Chaque personne qui
// remplit le formulaire public "Rejoindre la DBC" arrive ici sous forme de
// DOSSIER (une carte, un clic l'ouvre comme un CV : voir DossierCV.jsx).
// Le parcours :
//   1. "nouvelle"  : l'administration attribue le dossier à un leader
//                    d'antenne — de préférence du même pays que le
//                    candidat — pour l'entretien ;
//   2. "entretien" : le leader mène l'entretien (7 jours) et rend un compte-
//                    rendu à cocher depuis son espace leader ; si
//                    l'entretien est concluant, le bouton "Ajouter" (verrouillé
//                    jusque-là) ouvre le
//                    formulaire "Créer un membre" de Gestion des membres,
//                    déjà rempli avec les informations de l'inscription :
//                    l'administration valide le niveau et crée le membre ;
//   3. "acceptee"  : le membre existe (matricule affiché sur le dossier).
// Une candidature peut aussi être refusée ("refusee").
export default function Inscriptions() {
  const { t } = useTranslation();
  const registrations = useRegistrations();
  const membersSnapshot = useMembersStore();
  const { networksByCountry } = useNetworkData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [openId, setOpenId] = useState(null);
  const [assignId, setAssignId] = useState(null);
  const [refuseId, setRefuseId] = useState(null);
  // { registration, initialValues, note } pendant que le formulaire "Créer un
  // membre" est ouvert : figé à l'ouverture pour que le formulaire ne soit
  // pas réinitialisé pendant la saisie.
  const [creating, setCreating] = useState(null);
  const [notice, setNotice] = useState(null);

  const byId = useMemo(
    () => Object.fromEntries(registrations.map((item) => [item.id, item])),
    [registrations],
  );
  const members = useMemo(() => listMembers(membersSnapshot), [membersSnapshot]);

  const counts = useMemo(() => {
    const result = { all: registrations.length };
    REGISTRATION_STATUSES.forEach((status) => {
      result[status] = registrations.filter((item) => item.status === status).length;
    });
    return result;
  }, [registrations]);

  const countries = useMemo(
    () => Array.from(new Set(registrations.map((item) => item.pays))).sort((a, b) => a.localeCompare(b)),
    [registrations],
  );

  const visible = useMemo(() => {
    const query = normalizeSearchText(search);
    return registrations
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => countryFilter === "all" || item.pays === countryFilter)
      .filter((item) => levelFilter === "all" || item.tontine === levelFilter)
      .filter((item) => {
        if (!query) return true;
        const haystack = [
          fullName(item),
          item.email,
          item.pays,
          item.ville,
          item.travail,
          item.ref,
          item.parrain,
          item.assignment?.leaderName,
        ]
          .map(normalizeSearchText)
          .join(" ");
        return haystack.includes(query);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [registrations, statusFilter, countryFilter, levelFilter, search]);

  const openRegistration = openId ? byId[openId] : null;
  const assignRegistrationTarget = assignId ? byId[assignId] : null;
  const refuseTarget = refuseId ? byId[refuseId] : null;

  // Dossiers dont le compte-rendu est attendu depuis plus de 7 jours.
  const overdueCount = useMemo(
    () =>
      registrations.filter(
        (item) =>
          item.status === "entretien" &&
          interviewStage(item) !== "done" &&
          deadlineState(item.assignment)?.overdue,
      ).length,
    [registrations],
  );

  const startCreate = (registration) => {
    // Le membre ne peut être créé qu'après un entretien concluant.
    if (interviewStage(registration) !== "done") return;
    const initialValues = memberPrefillFrom(registration, members);
    const notes = [t("admin.inscriptions.create.prefillNote", { ref: registration.ref })];
    if (registration.parrain && !initialValues.sponsorMatricule) {
      notes.push(t("admin.inscriptions.create.sponsorUnknown", { matricule: registration.parrain }));
    }
    setCreating({ registration, initialValues, note: notes.join(" ") });
  };

  const handleCreate = (levelKey, form) => {
    if (!creating) return;
    const created = createMember(levelKey, form);
    markRegistrationAccepted(creating.registration.id, {
      memberId: created.id,
      matricule: created.matricule,
    });
    setNotice({ name: created.name, matricule: created.matricule });
    setCreating(null);
    setOpenId(null);
  };

  const handleAssign = ({ leader, interviewDate, note }) => {
    if (!assignRegistrationTarget) return;
    assignRegistration(assignRegistrationTarget.id, { leader, interviewDate, note });
    setAssignId(null);
  };

  const handleRefuse = () => {
    if (refuseTarget) refuseRegistration(refuseTarget.id);
    setRefuseId(null);
  };

  const statCards = [
    { key: "all", label: t("admin.inscriptions.stats.all"), dot: "bg-gray-700" },
    ...REGISTRATION_STATUSES.map((status) => ({
      key: status,
      label: t(`admin.inscriptions.stats.${status}`),
      dot: STATUS_STYLE[status].dot,
    })),
  ];

  return (
    <Page title={`Admin – ${t("admin.inscriptions.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.inscriptions.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.inscriptions.searchPlaceholder")}
        />

        <p className="mt-4 max-w-3xl text-sm text-gray-500">{t("admin.inscriptions.subtitle")}</p>

        {overdueCount > 0 && (
          <div
            role="status"
            data-testid="overdue-notice"
            className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800"
          >
            <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {t("admin.inscriptions.overdueNotice", { count: overdueCount })}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-green-50 p-3.5 text-sm text-green-800"
          >
            <p className="flex items-start gap-2">
              <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <span>
                {t("admin.inscriptions.notice.created", {
                  name: notice.name,
                  matricule: notice.matricule,
                })}{" "}
                <Link to="/admin/membres" className="font-semibold underline">
                  {t("admin.inscriptions.notice.see")}
                </Link>
              </span>
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label={t("admin.membres.modal.close")}
              className="shrink-0 rounded-full p-1 text-green-700 hover:bg-green-100"
            >
              <XMarkIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {statCards.map((card) => {
            const active = statusFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setStatusFilter(card.key)}
                aria-pressed={active}
                className={clsx(
                  "rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors",
                  active ? "border-[#EE7115] ring-1 ring-[#EE7115]/40" : "border-gray-100 hover:border-gray-200",
                )}
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span aria-hidden="true" className={clsx("size-2 rounded-full", card.dot)} />
                  {card.label}
                </span>
                <span className="mt-1 block text-2xl font-extrabold text-gray-900">{counts[card.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
            aria-label={t("admin.inscriptions.filters.country")}
            className={SELECT}
          >
            <option value="all">{t("admin.inscriptions.filters.allCountries")}</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            aria-label={t("admin.inscriptions.filters.level")}
            className={SELECT}
          >
            <option value="all">{t("admin.inscriptions.filters.allLevels")}</option>
            {levels.map((level) => (
              <option key={level.key} value={level.key}>
                {t("admin.membres.levelWithName", {
                  n: levelNumbers[level.key],
                  name: t(`simulateur.levels.${level.key}.name`),
                })}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center">
            <FolderOpenIcon aria-hidden="true" className="size-10 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-900">{t("admin.inscriptions.empty.title")}</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">{t("admin.inscriptions.empty.description")}</p>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((registration) => (
              <li key={registration.id}>
                <DossierCard
                  registration={registration}
                  onOpen={() => setOpenId(registration.id)}
                  onAssign={() => setAssignId(registration.id)}
                  onAdd={() => startCreate(registration)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {openRegistration && (
        <DossierCV
          registration={openRegistration}
          onClose={() => setOpenId(null)}
          onAssign={() => setAssignId(openRegistration.id)}
          onAdd={() => startCreate(openRegistration)}
          onRefuse={() => setRefuseId(openRegistration.id)}
        />
      )}

      <AssignLeaderModal
        registration={assignRegistrationTarget}
        networksByCountry={networksByCountry}
        onClose={() => setAssignId(null)}
        onConfirm={handleAssign}
      />

      <AddMemberModal
        open={Boolean(creating)}
        mode="add"
        defaultLevel={creating?.registration.tontine}
        initialValues={creating?.initialValues ?? null}
        prefillNote={creating?.note ?? ""}
        onClose={() => setCreating(null)}
        onSubmit={handleCreate}
        suggestMatricule={(levelKey) => suggestMatricule(membersSnapshot, levelNumbers[levelKey])}
        existingMembers={members.map((member) => ({ name: member.name, matricule: member.matricule }))}
      />

      <ConfirmDialog
        open={Boolean(refuseTarget)}
        title={t("admin.inscriptions.refuse.title", { name: refuseTarget ? fullName(refuseTarget) : "" })}
        description={t("admin.inscriptions.refuse.description")}
        confirmLabel={t("admin.inscriptions.refuse.confirm")}
        tone="danger"
        onConfirm={handleRefuse}
        onCancel={() => setRefuseId(null)}
      />
    </Page>
  );
}
