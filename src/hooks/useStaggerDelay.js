// Import Dependencies
import { useEffect, useState } from "react";

// ----------------------------------------------------------------------

// Renvoie un délai de transition (ex: "260ms") à poser en
// style={{ transitionDelay }} pour un effet d'apparition "en cascade".
// Le délai n'est actif que pendant l'apparition elle-même : une fois
// l'élément visible, il repasse à "0ms" pour ne pas ralentir les
// interactions (hover) qui suivent. Quand l'élément ressort de l'écran
// (isInView redevient false), le délai est réarmé pour la prochaine
// apparition — c'est ce qui permet à l'effet de se rejouer à chaque scroll.
export function useStaggerDelay(isInView, delay, revealDuration = 700) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!isInView) {
      setSettled(false);
      return undefined;
    }
    const timeout = setTimeout(() => setSettled(true), delay + revealDuration);
    return () => clearTimeout(timeout);
  }, [isInView, delay, revealDuration]);

  return settled ? "0ms" : `${delay}ms`;
}
