// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { getPoleDescription, getPoleTitle, getSeatTitle } from "./mockData";
import { POLE_ICON_OPTIONS } from "./poleIcons";

// ----------------------------------------------------------------------

let seatSeq = 0;
const nextSeatFormId = () => `new-${Date.now()}-${seatSeq++}`;

const EMPTY_FORM = () => ({
  title: "",
  description: "",
  iconKey: POLE_ICON_OPTIONS[0].key,
  seats: [{ id: nextSeatFormId(), title: "" }],
});

// Formulaire d'ajout/modification d'un pôle de gouvernance : titre,
// description, icône, et — seulement pour un pôle "à postes nommés"
// (kind "assignable", le seul type qu'on peut créer soi-même) — la liste
// de ses postes, librement ajoutables/retirables. Les 3 autres types de
// pôles fournis avec le site (Direction Fondatrice, Réseau des Leaders
// d'Antennes, Conseil des Légendes) gardent leur fonctionnement propre
// (poste unique non réassignable, branches réelles, niveau automatique)
// — les modifier ici ne touche que leur identité (titre/description/
// icône), jamais leurs postes.
export function PoleFormModal({ open, pole, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);

  const editableSeats = !pole || pole.kind === "assignable";

  useEffect(() => {
    if (!open) return;
    if (pole) {
      setForm({
        title: getPoleTitle(pole, t),
        description: getPoleDescription(pole, t),
        iconKey: pole.iconKey ?? POLE_ICON_OPTIONS[0].key,
        seats:
          pole.kind === "assignable"
            ? pole.seats.map((seat) => ({ id: seat.id, title: getSeatTitle(seat, t) }))
            : [],
      });
    } else {
      setForm(EMPTY_FORM());
    }
  }, [open, pole]);

  const updateField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const updateSeatTitle = (index, value) =>
    setForm((prev) => {
      const seats = [...prev.seats];
      seats[index] = { ...seats[index], title: value };
      return { ...prev, seats };
    });

  const addSeat = () =>
    setForm((prev) => ({ ...prev, seats: [...prev.seats, { id: nextSeatFormId(), title: "" }] }));

  const removeSeat = (index) =>
    setForm((prev) => ({ ...prev, seats: prev.seats.filter((_, i) => i !== index) }));

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      iconKey: form.iconKey,
    };

    if (editableSeats) {
      payload.kind = "assignable";
      payload.seats = form.seats
        .map((seat) => ({ ...seat, title: seat.title.trim() }))
        .filter((seat) => seat.title)
        .map((seat) => {
          const existing = pole?.kind === "assignable"
            ? pole.seats.find((s) => s.id === seat.id)
            : undefined;
          return {
            id: existing?.id ?? `seat-${Date.now()}-${seatSeq++}`,
            title: seat.title,
            memberId: existing?.memberId ?? null,
          };
        });
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <DialogTitle className="text-base font-bold text-gray-900">
              {pole ? t("admin.gouvernance.poleForm.editTitle") : t("admin.gouvernance.poleForm.addTitle")}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.gouvernance.poleForm.cancel")}
              className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.gouvernance.poleForm.name")}
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={updateField("title")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                />
              </label>

              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.gouvernance.poleForm.description")}
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={updateField("description")}
                  className="mt-1 block w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                />
              </label>

              <div>
                <p className="text-xs font-semibold text-gray-500">
                  {t("admin.gouvernance.poleForm.icon")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {POLE_ICON_OPTIONS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, iconKey: key }))}
                      aria-pressed={form.iconKey === key}
                      className={clsx(
                        "flex size-10 items-center justify-center rounded-xl border transition-colors",
                        form.iconKey === key
                          ? "border-[#52A2DF] bg-[#52A2DF]/[0.1] text-[#52A2DF]"
                          : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </button>
                  ))}
                </div>
              </div>

              {editableSeats ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    {t("admin.gouvernance.poleForm.seats")}
                  </p>
                  <div className="mt-1.5 space-y-2">
                    {form.seats.map((seat, index) => (
                      <div key={seat.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={seat.title}
                          onChange={(event) => updateSeatTitle(index, event.target.value)}
                          placeholder={t("admin.gouvernance.poleForm.seatPlaceholder")}
                          className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                        />
                        {form.seats.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSeat(index)}
                            aria-label={t("admin.gouvernance.poleForm.removeSeat")}
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
                          >
                            <XMarkIcon aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSeat}
                    className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#52A2DF] hover:underline"
                  >
                    <PlusIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.gouvernance.poleForm.addSeat")}
                  </button>
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                  {t("admin.gouvernance.poleForm.seatsManagedElsewhere")}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("admin.gouvernance.poleForm.cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {pole ? t("admin.gouvernance.poleForm.save") : t("admin.gouvernance.poleForm.add")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
