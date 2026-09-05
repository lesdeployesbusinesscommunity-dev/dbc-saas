// Local Imports
import { Page } from "components/shared/Page";
import { WhatIsDbc } from "./WhatIsDbc";
import { Pillars } from "./Pillars";
import { Ecosystem } from "./Ecosystem";
import { Programs } from "./Programs";
import { Ambition } from "./Ambition";
import { PanAfrican } from "./PanAfrican";

// ----------------------------------------------------------------------

// Page "A propos" = /a-propos. Elle enchaîne : présentation de la DBC
// (texte + bouton + image), les 4 piliers en cartes, les 4 mécanismes
// différenciants (écosystème), les programmes DBC, la feuille de route
// 2026-2030, puis la présence panafricaine. Alternance de bandeaux
// blancs/orange (10%) pour rythmer la page.
export default function APropos() {
  return (
    <Page title="A propos">
      <WhatIsDbc />
      <Pillars />
      <Ecosystem />
      <Programs />
      <Ambition />
      <PanAfrican />
    </Page>
  );
}
