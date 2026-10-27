// Import Dependencies
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ArrowUturnLeftIcon, CursorArrowRaysIcon, FlagIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Une couleur par étape, comme les épingles d'une carte routière.
const COLORS = ["#EE7115", "#16A34A", "#7C3AED", "#E11D48", "#52A2DF", "#0D9488"];
const WIDE = 960; // largeur (px) à partir de laquelle les cartes passent de chaque côté de la route
const SWAY = { wide: 88, narrow: 8 }; // de combien la route ondule de part et d'autre
const HALF_GAP = 128; // espace réservé à la route, de part et d'autre du centre (px)
const STEP = 210; // écart vertical minimum entre deux épingles (la route serpente d'autant)
const GAP = 40; // espace vertical entre deux cartes du même côté
const ROAD = { wide: 44, narrow: 26 }; // épaisseur de la route
const colorOf = (index) => COLORS[index % COLORS.length];

// Une carte d'étape : le titre, la phrase, la démonstration (qui repart de zéro
// quand la carte entre à l'écran) et l'invitation à la manipuler.
const StepCard = memo(function StepCard({ step, index, shown, wide, onTouch, touched, total }) {
  const { t } = useTranslation();
  const color = colorOf(index);
  const side = index % 2 === 0 ? -1 : 1;
  const Scene = step.Scene;
  return (
    <article
      aria-labelledby={`guide-step-${step.key}`}
      className={clsx(
        "rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 transition-all duration-700 ease-out motion-reduce:transition-none sm:p-5",
        shown ? "translate-x-0 translate-y-0 opacity-100" : wide ? (side < 0 ? "-translate-x-10" : "translate-x-10") + " opacity-0" : "translate-y-6 opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-block rounded-lg px-3 py-1 text-xs font-extrabold uppercase tracking-wide"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {index + 1}. {step.short}
        </span>
        <span className="text-xs font-semibold text-gray-400">{t("guideJourney.stepOf", { current: index + 1, total })}</span>
      </div>
      <h3 id={`guide-step-${step.key}`} className="mt-3 text-lg font-bold text-gray-900">
        {step.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.text}</p>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <Scene key={shown ? "on" : "off"} voice={step.voice} onInteract={() => onTouch(step.key)} />
      </div>

      {step.hint && (
        <p className="mt-3 flex items-start gap-2 text-xs font-medium text-gray-500">
          <CursorArrowRaysIcon aria-hidden="true" className={clsx("mt-0.5 size-4 shrink-0", !touched && "animate-pulse")} style={{ color }} />
          <span>{step.hint}</span>
        </p>
      )}
    </article>
  );
});

// L'épingle d'une étape, plantée sur la route (la pointe touche le trait).
function Pin({ x, y, color, active, passed, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{ left: x, top: y }}
      className={clsx(
        "absolute z-10 size-11 -translate-x-1/2 -translate-y-[53px] outline-none transition-transform duration-500 focus-visible:scale-110 motion-reduce:transition-none",
        active ? "scale-125" : passed ? "scale-100" : "scale-90 opacity-80",
      )}
    >
      {active && (
        <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full opacity-40 motion-reduce:hidden" style={{ backgroundColor: color }} />
      )}
      <span aria-hidden="true" className="absolute inset-0 -rotate-45 rounded-full rounded-bl-none shadow-lg ring-2 ring-white" style={{ backgroundColor: color }} />
      <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-white">{children}</span>
    </button>
  );
}

// Le PARCOURS : une route sinueuse qui descend le long de la page, avec une
// épingle numérotée par étape et une carte de chaque côté (sur téléphone : la
// route à gauche, les cartes à droite). En faisant défiler, un voyageur avance
// sur la route, qui s'allume derrière lui ; chaque carte s'anime en arrivant.
// Réutilisable : on lui passe les étapes { key, short, title, text, hint,
// voice, Scene }.
export function GuideJourney({ steps, doneTitle, doneText, backTo, backLabel, initialStep = 0 }) {
  const { t } = useTranslation();
  const total = steps.length;
  const wrapRef = useRef(null);
  const rowRefs = useRef([]);
  const roadRef = useRef(null);
  const litRef = useRef(null);
  const tintRef = useRef(null);
  const travelerRef = useRef(null);
  const geoRef = useRef(null);
  const frame = useRef(0);

  const [geo, setGeo] = useState({ w: 0, h: 0, wide: false, start: { x: 0, y: 0 }, pins: [], tops: [], d: "" });
  const [shown, setShown] = useState(() => new Set());
  const [touched, setTouched] = useState(() => new Set());
  const [active, setActive] = useState(-1);

  // Place les cartes puis trace la route. Sur grand écran, les cartes alternent à gauche et à
  // droite et se chevauchent en hauteur (chacune démarre un peu après la précédente), ce qui
  // fait serpenter la route ; sur téléphone, elles se suivent à droite d'une route étroite.
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.offsetWidth;
    const wide = w >= WIDE;
    const cx = wide ? w / 2 : 30;
    const sway = wide ? SWAY.wide : SWAY.narrow;
    const heights = Array.from({ length: total + 1 }, (_unused, i) => rowRefs.current[i]?.offsetHeight ?? 0);

    const tops = [];
    const bottoms = [];
    for (let i = 0; i < total; i += 1) {
      let top;
      if (i === 0) top = wide ? 90 : 76;
      else if (wide) top = Math.max(tops[i - 1] + STEP, i >= 2 ? bottoms[i - 2] + GAP : 0);
      else top = bottoms[i - 1] + GAP;
      tops.push(top);
      bottoms.push(top + heights[i]);
    }
    const lastTwo = bottoms.slice(-2);
    const finishTop = wide ? Math.max(tops[total - 1] + STEP, ...lastTwo) + 24 : bottoms[total - 1] + GAP;
    tops.push(finishTop);
    const h = finishTop + heights[total] + 16;

    const drop = wide ? 66 : 54;
    const points = [{ x: cx, y: 30 }];
    const pins = [];
    tops.forEach((top, i) => {
      const finish = i === total;
      const side = i % 2 === 0 ? -1 : 1;
      const point = { x: finish ? cx : cx + side * sway, y: top + (finish ? 38 : drop) };
      points.push(point);
      pins.push({ ...point, index: i, finish });
    });
    const d = points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = points[i - 1];
      const mid = (point.y - prev.y) * 0.5;
      return `${path} C ${prev.x} ${prev.y + mid} ${point.x} ${point.y - mid} ${point.x} ${point.y}`;
    }, "");

    const next = { w, h, wide, start: points[0], pins, tops, d };
    setGeo((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
  }, [total]);

  useLayoutEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    rowRefs.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    geoRef.current = geo;
  }, [geo]);

  // Avance le voyageur : il suit le milieu de l'écran le long de la route, qui s'allume derrière lui.
  const travel = useCallback(() => {
    const wrap = wrapRef.current;
    const road = roadRef.current;
    const current = geoRef.current;
    if (!wrap || !road || !current?.d) return;
    const length = road.getTotalLength();
    const rect = wrap.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, window.innerHeight * 0.55 - rect.top));
    let lo = 0;
    let hi = length;
    for (let i = 0; i < 22; i += 1) {
      const mid = (lo + hi) / 2;
      if (road.getPointAtLength(mid).y < y) lo = mid;
      else hi = mid;
    }
    const at = (lo + hi) / 2;
    const point = road.getPointAtLength(at);
    [litRef.current, tintRef.current].forEach((path) => {
      if (!path) return;
      path.setAttribute("stroke-dasharray", `${length} ${length}`);
      path.setAttribute("stroke-dashoffset", String(length - at));
    });
    if (travelerRef.current) travelerRef.current.style.transform = `translate(${point.x}px, ${point.y}px)`;
    let now = -1;
    current.pins.forEach((pin) => {
      if (pin.y <= point.y + 24) now = pin.index;
    });
    setActive(now);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(travel);
    };
    // Le défilement ne "remonte" pas : on l'écoute en phase de capture pour attraper celui de la page, où qu'il soit.
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, [travel, geo.d]);

  // Chaque carte "arrive" quand elle entre à l'écran, une seule fois.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setShown(new Set(steps.map((_step, i) => i)));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.dataset.index);
          setShown((current) => (current.has(index) ? current : new Set(current).add(index)));
        }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    rowRefs.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, [steps]);

  const goTo = useCallback((index) => {
    rowRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Ouvert sur une étape précise (ex : ?etape=ledger) : on s'y rend d'emblée.
  useEffect(() => {
    if (initialStep <= 0) return undefined;
    const id = setTimeout(() => rowRefs.current[initialStep]?.scrollIntoView({ block: "center" }), 350);
    return () => clearTimeout(id);
  }, [initialStep]);

  const onTouch = useCallback((key) => setTouched((current) => (current.has(key) ? current : new Set(current).add(key))), []);
  const restart = () => wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const road = geo.wide ? ROAD.wide : ROAD.narrow;
  const lastColor = colorOf(total);

  return (
    <div ref={wrapRef} className="relative" style={{ height: geo.h || undefined, minHeight: geo.h ? undefined : 600 }}>
      {geo.d && (
        <svg aria-hidden="true" width={geo.w} height={geo.h} className="pointer-events-none absolute left-0 top-0">
          <path d={geo.d} fill="none" stroke="#e5e7eb" strokeWidth={road + 8} strokeLinecap="round" />
          <path ref={roadRef} d={geo.d} fill="none" stroke="#1f2937" strokeWidth={road} strokeLinecap="round" />
          <path ref={tintRef} d={geo.d} fill="none" stroke="#EE7115" strokeOpacity="0.28" strokeWidth={road - 6} strokeLinecap="round" strokeDasharray="0 100000" />
          <path d={geo.d} fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2.5" strokeDasharray="10 12" />
          <path ref={litRef} d={geo.d} fill="none" stroke="#EE7115" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0 100000" />
        </svg>
      )}

      {geo.d && (
        <>
          <span
            style={{ left: geo.start.x, top: geo.start.y }}
            className="absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-full bg-gray-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow"
          >
            {t("guideJourney.start")}
          </span>
          {geo.pins.map((pin) => (
            <Pin
              key={pin.index}
              x={pin.x}
              y={pin.y}
              color={colorOf(pin.index)}
              active={active === pin.index}
              passed={active >= pin.index}
              label={pin.finish ? t("guideJourney.finish") : `${pin.index + 1}. ${steps[pin.index]?.title}`}
              onClick={() => goTo(pin.index)}
            >
              {pin.finish ? <FlagIcon aria-hidden="true" className="size-5" /> : pin.index + 1}
            </Pin>
          ))}
          <div ref={travelerRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-20">
            <span className="absolute -left-3 -top-3 size-6 animate-ping rounded-full bg-[#EE7115]/40 motion-reduce:hidden" />
            <span className="absolute -left-2 -top-2 size-4 rounded-full bg-[#EE7115] shadow-lg ring-2 ring-white" />
          </div>
        </>
      )}

      {steps.map((step, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const place = geo.wide
          ? { top: geo.tops[index] ?? 0, width: `calc(50% - ${HALF_GAP}px)`, [side < 0 ? "left" : "right"]: 0 }
          : { top: geo.tops[index] ?? 0, left: 68, right: 0 };
        return (
          <div
            key={step.key}
            ref={(element) => {
              rowRefs.current[index] = element;
            }}
            data-index={index}
            style={place}
            className="absolute"
          >
            <StepCard
              step={step}
              index={index}
              total={total}
              shown={shown.has(index)}
              wide={geo.wide}
              touched={touched.has(step.key)}
              onTouch={onTouch}
            />
          </div>
        );
      })}

      <div
        ref={(element) => {
          rowRefs.current[total] = element;
        }}
        data-index={total}
        style={geo.wide ? { top: geo.tops[total] ?? 0, left: "50%", width: 380, marginLeft: -190 } : { top: geo.tops[total] ?? 0, left: 68, right: 0 }}
        className="absolute pt-16"
      >
        <div
          className={clsx(
            "rounded-2xl bg-white p-5 text-center shadow-md ring-1 ring-black/5 transition-all duration-700 motion-reduce:transition-none",
            shown.has(total) ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
        >
          <span className="inline-block rounded-lg px-3 py-1 text-xs font-extrabold uppercase tracking-wide" style={{ backgroundColor: `${lastColor}22`, color: lastColor }}>
            {t("guideJourney.finish")}
          </span>
          <h3 className="mt-3 text-lg font-bold text-gray-900">{doneTitle}</h3>
          <p className="mt-1.5 text-sm text-gray-600">{doneText}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-gray-50"
            >
              <ArrowPathIcon aria-hidden="true" className="size-4" />
              {t("guideJourney.replay")}
            </button>
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <ArrowUturnLeftIcon aria-hidden="true" className="size-4" />
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
