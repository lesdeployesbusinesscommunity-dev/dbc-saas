// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Les images jointes à une annonce, en mosaïque : une seule image en grand, deux
// côte à côte, trois ou quatre en grille. Un clic ouvre l'image en grand (avec
// flèches et touches ← → quand il y en a plusieurs). "compact" : de petites
// vignettes, pour la liste de gestion côté auteur. "interactive={false}" :
// l'aperçu du formulaire, rien de cliquable.
export function AnnouncementImages({ images, title, compact = false, interactive = true }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(null);
  const count = images?.length ?? 0;

  useEffect(() => {
    if (current === null) return undefined;
    const onKey = (event) => {
      if (event.key === "ArrowLeft") setCurrent((index) => (index + count - 1) % count);
      if (event.key === "ArrowRight") setCurrent((index) => (index + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, count]);

  if (count === 0) return null;

  const alt = (index) => t("announcements.feed.imageAlt", { n: index + 1, count, title });

  const tile = (src, index, className) => {
    const image = <img src={src} alt={alt(index)} loading="lazy" className="size-full object-cover" />;
    if (!interactive) return <div key={index} className={clsx("overflow-hidden bg-gray-100", className)}>{image}</div>;
    return (
      <button
        key={index}
        type="button"
        onClick={() => setCurrent(index)}
        aria-label={t("announcements.feed.imageOpen", { n: index + 1, count })}
        className={clsx(
          "overflow-hidden bg-gray-100 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#EE7115]",
          className,
        )}
      >
        {image}
      </button>
    );
  };

  return (
    <>
      {compact ? (
        <div className="flex flex-wrap gap-2">{images.map((src, index) => tile(src, index, "size-14 rounded-lg"))}</div>
      ) : (
        <div className={clsx("grid gap-1.5 overflow-hidden rounded-xl", count > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((src, index) =>
            tile(
              src,
              index,
              count === 1 ? "aspect-[16/9] max-h-80" : count === 3 && index === 0 ? "col-span-2 aspect-[16/8]" : "aspect-[4/3]",
            ),
          )}
        </div>
      )}

      {current !== null && (
        <Dialog open onClose={() => setCurrent(null)} className="relative z-50">
          <div aria-hidden="true" className="fixed inset-0 bg-black/80" />
          <div className="fixed inset-0 flex w-screen items-center justify-center p-3 sm:p-8">
            <DialogPanel className="relative flex max-h-full max-w-full items-center justify-center">
              <DialogTitle className="sr-only">{alt(current)}</DialogTitle>
              <img src={images[current]} alt={alt(current)} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
              <button
                type="button"
                onClick={() => setCurrent(null)}
                aria-label={t("announcements.feed.imageClose")}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              >
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrent((index) => (index + count - 1) % count)}
                    aria-label={t("announcements.feed.imagePrev")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeftIcon aria-hidden="true" className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrent((index) => (index + 1) % count)}
                    aria-label={t("announcements.feed.imageNext")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRightIcon aria-hidden="true" className="size-5" />
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                    {current + 1} / {count}
                  </span>
                </>
              )}
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </>
  );
}
