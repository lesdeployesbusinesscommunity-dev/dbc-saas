// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  PlusIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { listerFormations, creerFormation } from "api/formations";
import { listerNiveaux } from "api/adhesion";
import { listerPiliers } from "api/programmes";

// ----------------------------------------------------------------------

// Page "Gestion des formations" (/admin/formation) : catalogue réel
// (GET /formations) + création (POST /formations, admin). Remplace
// l'ancienne version en mockData.js — le backend n'a pas (encore) de
// notion de formateur, date, durée ou pourcentage d'avancement par
// formation : cette version reste volontairement plus simple que
// l'ancienne maquette plutôt que d'inventer ces données.
export default function Formation() {
  const [formations, setFormations] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [piliers, setPiliers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [showAddModal, setShowAddModal] = useState(false);

  const charger = useCallback(async () => {
    setStatus("loading");
    try {
      const [formationsData, niveauxData, piliersData] = await Promise.all([
        listerFormations(),
        listerNiveaux(),
        listerPiliers(),
      ]);
      setFormations(formationsData);
      setNiveaux(niveauxData);
      setPiliers(piliersData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const nomNiveau = (id) => niveaux.find((n) => n.id === id)?.name ?? `Niveau #${id}`;
  const nomPilier = (code) => piliers.find((p) => p.code === code)?.name ?? code;

  return (
    <Page title="Admin – Formations">
      <div className="p-6 lg:p-8">
        <AdminTopBar title="Formations" />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Catalogue réel des formations ({formations.length}).
          </p>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Ajouter une formation
          </button>
        </div>

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger les formations pour le moment.
          </div>
        )}

        {status === "ready" && formations.length === 0 && (
          <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            Aucune formation pour l&apos;instant.
          </p>
        )}

        {status === "ready" && formations.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {formations.map((formation) => (
              <div
                key={formation.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
                  <AcademicCapIcon aria-hidden="true" className="size-4.5" />
                </span>
                <p className="mt-3 text-sm font-bold text-gray-900">{formation.name}</p>
                <p className="mt-1 text-xs text-gray-500">{formation.code}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#EE7115]/[0.1] px-2.5 py-1 text-xs font-semibold text-[#EE7115]">
                    {nomNiveau(formation.requiredLevelId)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    {nomPilier(formation.pillarCode)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddFormationDialog
        open={showAddModal}
        niveaux={niveaux}
        piliers={piliers}
        onClose={() => setShowAddModal(false)}
        onCreated={() => {
          setShowAddModal(false);
          charger();
        }}
      />
    </Page>
  );
}

function AddFormationDialog({ open, niveaux, piliers, onClose, onCreated }) {
  const [form, setForm] = useState({ code: "", title: "", requiredLevelId: "", pillarCode: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        code: "",
        title: "",
        requiredLevelId: niveaux[0]?.id ?? "",
        pillarCode: piliers[0]?.code ?? "",
      });
      setError("");
    }
  }, [open, niveaux, piliers]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.title.trim()) {
      setError("Le code et le titre sont requis");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await creerFormation({
        code: form.code.trim(),
        title: form.title.trim(),
        requiredLevelId: Number(form.requiredLevelId),
        pillarCode: form.pillarCode,
      });
      onCreated();
    } catch (err) {
      setError(err.message === "api.errors.validation" ? "Informations invalides" : "Impossible de créer la formation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-sm font-bold text-gray-900">Ajouter une formation</DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Code
              <input
                type="text"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="ex : ecole-des-affaires"
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Titre
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Niveau requis
              <select
                value={form.requiredLevelId}
                onChange={(event) => setForm((prev) => ({ ...prev, requiredLevelId: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              >
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Pilier
              <select
                value={form.pillarCode}
                onChange={(event) => setForm((prev) => ({ ...prev, pillarCode: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              >
                {piliers.map((pilier) => (
                  <option key={pilier.code} value={pilier.code}>
                    {pilier.name}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                {error}
              </span>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
                Créer
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
