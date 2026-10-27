// Import Dependencies
import { useEffect, useRef, useState } from "react";

// ----------------------------------------------------------------------

// Vrai quand la personne a demandé moins d'animations : le guide reste lisible
// (les valeurs s'affichent d'un coup, rien ne se rejoue tout seul).
export function usePrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

// Un nombre qui "compte" jusqu'à sa valeur au lieu de sauter.
export function useCountUp(target, duration = 700) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const current = useRef(value);

  useEffect(() => {
    if (reduced) {
      current.current = target;
      setValue(target);
      return undefined;
    }
    const from = current.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      current.current = from + (target - from) * eased;
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return Math.round(value);
}

// Rappelle "callback" toutes les "ms" tant que "enabled" est vrai (jamais si la
// personne préfère moins d'animations).
export function useAutoplay(callback, ms, enabled) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!enabled || reduced) return undefined;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [enabled, ms, reduced]);
}

// Fait apparaître "count" éléments l'un après l'autre (un toutes les "ms"). Tout
// est visible d'emblée si la personne préfère moins d'animations.
export function useStagger(count, ms = 70) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? count : 0);
  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setShown((current) => Math.min(count, current + 1)), ms);
    return () => clearInterval(id);
  }, [count, ms, reduced]);
  return shown;
}
