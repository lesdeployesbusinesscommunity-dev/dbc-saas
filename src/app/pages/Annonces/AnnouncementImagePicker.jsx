// Import Dependencies
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { IMAGE_ACCEPT, MAX_IMAGES, MAX_SOURCE_MB, prepareImage } from "./imageUtils";

// ----------------------------------------------------------------------

// Le choix des images à joindre à l'annonce : on clique (ou on glisse des
// fichiers) et chaque image est réduite puis ajoutée à la liste, avec une
// vignette et un bouton pour la retirer. "images" : les data URLs choisies ;
// "onChange" reçoit la nouvelle liste. Les fichiers refusés (pas une image, trop
// lourd, illisible, trop nombreux) sont nommés sous la zone.
export function AnnouncementImagePicker({ images, onChange }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [problems, setProblems] = useState([]);

  const room = MAX_IMAGES - images.length;

  const add = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    const issues = [];
    const accepted = files.slice(0, Math.max(room, 0));
    if (files.length > accepted.length) issues.push(t("announcements.composer.images.tooMany", { max: MAX_IMAGES }));

    setBusy(true);
    const ready = [];
    for (const file of accepted) {
      try {
        ready.push(await prepareImage(file));
      } catch (error) {
        const code = ["type", "size"].includes(error?.code) ? error.code : "read";
        issues.push(t(`announcements.composer.images.${code}`, { name: file.name, mb: MAX_SOURCE_MB }));
      }
    }
    setBusy(false);
    setProblems(issues);
    if (ready.length > 0) onChange([...images, ...ready]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-700">
          {t("announcements.composer.images.label")}{" "}
          <span className="font-normal text-gray-400">({t("announcements.composer.images.optional")})</span>
        </span>
        <span className="text-xs font-medium text-gray-400">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      {images.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((src, index) => (
            <li key={index} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
              <img src={src} alt={t("announcements.composer.images.thumbAlt", { n: index + 1 })} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_unused, i) => i !== index))}
                aria-label={t("announcements.composer.images.remove", { n: index + 1 })}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
              >
                <XMarkIcon aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {room > 0 && (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            add(event.dataTransfer.files);
          }}
          className={clsx(
            "relative mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
            dragging ? "border-[#EE7115] bg-[#EE7115]/[0.06]" : "border-gray-200 hover:border-[#EE7115]/60 hover:bg-gray-50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            disabled={busy}
            onChange={(event) => add(event.target.files)}
            className="sr-only"
          />
          <PhotoIcon aria-hidden="true" className="size-6 text-[#EE7115]" />
          <span className="text-sm font-semibold text-gray-800">
            {busy ? t("announcements.composer.images.busy") : t("announcements.composer.images.add")}
          </span>
          <span className="text-xs text-gray-400">{t("announcements.composer.images.hint", { max: MAX_IMAGES })}</span>
        </label>
      )}

      {problems.length > 0 && (
        <ul role="alert" className="mt-2 space-y-0.5 text-xs text-red-600">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
