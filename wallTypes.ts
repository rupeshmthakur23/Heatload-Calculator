// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/wallTypes.ts

export interface WallTypeDefinition {
  key: string;
  label: string;
  construction: string;
  advantages: string;
  disadvantages: string;

  /** z. B. "8 cm EPS", "36,5 cm" … */
  thickness: string;
  /** [min, max] in W/m²K */
  uValueRange: [number, number];
}

/**
 * Hinweis:
 * - Labels sind konsequent auf Deutsch.
 * - uValueRange sind typische Richtwerte (W/m²K) und dienen der UI-Orientierung.
 * - thickness ist eine kurze, menschenlesbare Angabe zur Schichtdicke.
 */
export const WALL_TYPES: WallTypeDefinition[] = [
  // — Grundtypen
  {
    key: "singleSolid",
    label: "Einlagige Massivwand",
    construction:
      "Massive Bauteile (z. B. Ziegel, Bims, Beton) optional mit außenliegender Dämmung.",
    advantages: "Hohe Wärmespeicherfähigkeit, robuste und einfache Ausführung.",
    disadvantages:
      "Für gute Effizienz meist zusätzliche Außendämmung erforderlich.",
    thickness: "",
    uValueRange: [0, 0],
  },
  {
    key: "ventilatedFacade",
    label: "Hinterlüftete Fassade",
    construction:
      "Tragwand + Dämmung + Hinterlüftungsebene + Fassadenbekleidung.",
    advantages:
      "Sehr gute Feuchteabfuhr, langlebig, vielseitige Bekleidungen möglich.",
    disadvantages: "Aufwendiger Aufbau, höhere Investitionskosten.",
    thickness: "",
    uValueRange: [0, 0],
  },
  {
    key: "etics",
    label: "WDVS (ETICS)",
    construction: "Massivwand + geklebte Dämmplatten + Armierung + Putz.",
    advantages: "Kosteneffizient, ideal zur nachträglichen Sanierung.",
    disadvantages: "Mechanisch verletzbar, detailgerechte Ausführung nötig.",
    thickness: "",
    uValueRange: [0, 0],
  },
  {
    key: "timberFrame",
    label: "Holzständerwerk",
    construction:
      "Holzrahmenkonstruktion mit Dämmstoff in Gefachen, innen/außen beplankt.",
    advantages: "Sehr gute Dämmwerte, nachhaltiger Baustoff, schnelle Montage.",
    disadvantages: "Geringere Wärmespeicherfähigkeit als massive Bauweise.",
    thickness: "",
    uValueRange: [0, 0],
  },
  {
    key: "prefab",
    label: "Fertigteile / Modulbau",
    construction:
      "Werkseitig vorgefertigte, bereits gedämmte Elemente (Modulelemente).",
    advantages: "Kurze Bauzeit, hohe Qualität durch Vorfertigung.",
    disadvantages: "Weniger individuell, Transport/Logistik beachten.",
    thickness: "",
    uValueRange: [0, 0],
  },

  // — Ungedämmte Bestandswände
  {
    key: "brick24",
    label: "Ziegel (24 cm)",
    construction: "Vollziegel-Mauerwerk, ungedämmt.",
    advantages: "Robust, hohe Masse.",
    disadvantages: "Hohe U-Werte, energetisch schwach ohne Dämmung.",
    thickness: "24 cm",
    uValueRange: [1.8, 2.1],
  },
  {
    key: "brick36",
    label: "Ziegel (36 cm)",
    construction: "Vollziegel-Mauerwerk, ungedämmt.",
    advantages: "Robust, höhere Masse.",
    disadvantages: "Weiterhin hohe U-Werte ohne Dämmung.",
    thickness: "36 cm",
    uValueRange: [1.2, 1.5],
  },
  {
    key: "hollowBrick36",
    label: "Hohlziegel (36 cm)",
    construction: "Loch-/Hohlziegel-Mauerwerk, ungedämmt.",
    advantages: "Etwas bessere Dämmwirkung als Vollziegel gleicher Dicke.",
    disadvantages: "Für Effizienz meist zusätzliche Dämmung erforderlich.",
    thickness: "36 cm",
    uValueRange: [1.0, 1.3],
  },
  {
    key: "rubbleStone50",
    label: "Bruchstein (50 cm)",
    construction: "Bruchstein-Mauerwerk, ungedämmt.",
    advantages: "Hohe Masse, denkmalpflegerisch oft relevant.",
    disadvantages: "Schlechte Dämmung, teils ungleichmäßiger Aufbau.",
    thickness: "50 cm",
    uValueRange: [1.5, 1.8],
  },
  {
    key: "concrete20",
    label: "Beton (20 cm)",
    construction: "Ortbeton oder Fertigteil, ungedämmt.",
    advantages: "Sehr robust, tragfähig.",
    disadvantages: "Sehr schlechte Dämmung ohne zusätzliche Dämmung.",
    thickness: "20 cm",
    uValueRange: [3.0, 3.5],
  },
  {
    key: "halfTimbered20",
    label: "Fachwerk (20 cm)",
    construction: "Fachwerk mit Gefachen, ungedämmt.",
    advantages: "Traditionelle Bauweise, hohe Speichermasse in Gefachen.",
    disadvantages: "Hohe U-Werte; Sanierung/Innendämmung diffusionssicher ausführen.",
    thickness: "20 cm",
    uValueRange: [1.5, 2.5],
  },
  {
    key: "pumice30",
    label: "Bims (30 cm)",
    construction: "Bims-/Leichtbetonstein, ungedämmt.",
    advantages: "Leichter Stein, einfache Verarbeitung.",
    disadvantages: "Ohne Dämmung energetisch unzureichend.",
    thickness: "30 cm",
    uValueRange: [1.3, 1.6],
  },

  // — Sanierung / Modernisierung
  {
    key: "brickEps8",
    label: "Ziegel + 8 cm EPS",
    construction: "Bestandsziegel mit 8 cm EPS-WDVS.",
    advantages: "Deutlich verbesserter Wärmeschutz, wirtschaftlich.",
    disadvantages: "Mechanische Empfindlichkeit des WDVS.",
    thickness: "8 cm EPS",
    uValueRange: [0.35, 0.40],
  },
  {
    key: "concreteEps10",
    label: "Beton + 10 cm EPS",
    construction: "Betonwand mit 10 cm EPS-WDVS.",
    advantages: "Großer U-Wert-Sprung zu geringen Kosten.",
    disadvantages: "Details und Anschlüsse sorgfältig planen.",
    thickness: "10 cm EPS",
    uValueRange: [0.25, 0.30],
  },
  {
    key: "timberfiber10",
    label: "Holzfaser + 10 cm",
    construction: "Holzfaser-Dämmplatten (z. B. Sanierungsdämmung) außen.",
    advantages: "Diffusionsoffen, gute Ökobilanz.",
    disadvantages: "Aufpreis gegenüber EPS, Schlagregenschutz beachten.",
    thickness: "10 cm",
    uValueRange: [0.30, 0.40],
  },
  {
    key: "pumiceMineral12",
    label: "Bims + 12 cm Mineralwolle",
    construction: "Bims/Leichtbeton mit 12 cm Mineralwolldämmung (WDVS).",
    advantages: "Guter Brand- und Schallschutz.",
    disadvantages: "Sorgfältige Ausbildung von Details nötig.",
    thickness: "12 cm",
    uValueRange: [0.20, 0.25],
  },
  {
    key: "lightweight14",
    label: "Leichtbau + 14 cm",
    construction: "Leichtbau-/Bestandswand mit 14 cm Außendämmung.",
    advantages: "Sehr gute Dämmwerte erreichbar.",
    disadvantages: "Dickeres Fassadenpaket; optische Anpassung beachten.",
    thickness: "14 cm",
    uValueRange: [0.15, 0.20],
  },

  // — Neubau / sehr gute Standards
  {
    key: "perliteBrick36_5",
    label: "Perlitziegel (36,5 cm)",
    construction: "Hochwärmedämmender Hochlochziegel mit Perlitfüllung.",
    advantages: "Guter Dämmwert monolithisch ohne WDVS.",
    disadvantages: "Höhere Kosten, statische Grenzen beachten.",
    thickness: "36,5 cm",
    uValueRange: [0.18, 0.22],
  },
  {
    key: "concreteEtics20",
    label: "Beton + 20 cm WDVS",
    construction: "Betonwand mit 20 cm Wärmedämm-Verbundsystem.",
    advantages: "Sehr niedrige U-Werte erreichbar.",
    disadvantages: "Dicke Dämmschicht; sorgfältige Detailplanung nötig.",
    thickness: "20 cm WDVS",
    uValueRange: [0.12, 0.15],
  },
  {
    key: "timberFrame24",
    label: "Holzrahmen + 24 cm Dämmung",
    construction: "Holzrahmenbauweise mit 24 cm Dämmstoff in den Gefachen.",
    advantages: "Sehr gute Dämmung, schnelle Bauweise.",
    disadvantages: "Geringere Speichermasse.",
    thickness: "24 cm",
    uValueRange: [0.10, 0.14],
  },
  {
    key: "passiveWall30",
    label: "Passivhaus-Wand (+30 cm Dämmung)",
    construction: "Hochgedämmter Wandaufbau für Passivhaus-Standard.",
    advantages: "Extrem niedrige U-Werte, sehr energieeffizient.",
    disadvantages: "Mehrkosten, größere Wanddicken.",
    thickness: "≈ 30 cm Dämmung",
    uValueRange: [0.08, 0.12],
  },

  // — Innendämmung
  {
    key: "calcium5",
    label: "Kalziumsilikatplatten (5 cm)",
    construction: "Kapillaraktive Innendämmung aus Kalziumsilikat.",
    advantages: "Feuchteregulierend, schimmelhemmend.",
    disadvantages: "Geringere Dämmwirkung als dicke Außendämmung.",
    thickness: "5 cm",
    uValueRange: [0.40, 0.50],
  },
  {
    key: "woodfiber6",
    label: "Holzfaser (6 cm) – innen",
    construction: "Diffusionsoffene Holzfaser-Innendämmung.",
    advantages: "Ökologisch, verbessert sommerlichen Hitzeschutz.",
    disadvantages: "Dicker erforderlich als Hochleistungsdämmstoffe.",
    thickness: "6 cm",
    uValueRange: [0.35, 0.45],
  },
  {
    key: "aerogel2",
    label: "Aerogelplatten (2 cm) – innen",
    construction: "Hochleistungs-Innendämmung mit Aerogel.",
    advantages: "Sehr schlank, gute Dämmwerte bei wenig Platz.",
    disadvantages: "Relativ teuer, sorgfältige Verarbeitung nötig.",
    thickness: "2 cm",
    uValueRange: [0.20, 0.30],
  },
];

/** Praktische Map: { [key]: [min,max] } – falls an anderer Stelle benötigt. */
export const WALL_U_VALUES: Record<string, [number, number]> = Object.fromEntries(
  WALL_TYPES.map((w) => [w.key, w.uValueRange])
);
