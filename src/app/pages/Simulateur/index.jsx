// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "./data";
import { SimulatorCard } from "./SimulatorCard";
import { ComparisonTable } from "./ComparisonTable";

// ----------------------------------------------------------------------

// Page "Simulateur de Revenus" = /simulateur-de-revenus. Le niveau choisi
// dans le simulateur met en avant la ligne correspondante dans le
// tableau comparatif juste en dessous.
export default function Simulateur() {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState(levels[0]);
  const [filleuls, setFilleuls] = useState(0);

  return (
    <Page title={t("simulateur.title")}>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <SimulatorCard
          levels={levels}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          filleuls={filleuls}
          onFilleulsChange={setFilleuls}
        />
      </div>

      <ComparisonTable levels={levels} selectedKey={selectedLevel.key} />
    </Page>
  );
}
