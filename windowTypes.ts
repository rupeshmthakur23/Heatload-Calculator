// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/windowTypes.ts

import type { WindowTypeKey } from "./windowUValues";

export interface WindowTypeDefinition {
  key: WindowTypeKey;
  label: string;
  material: string;
  uValueRange: [number, number]; // usable for visualizations or sliders
  advantages: string;
  disadvantages: string;
}

export const WINDOW_TYPES: readonly WindowTypeDefinition[] = [
  {
    key: "singlePane",
    label: "Einscheibenfenster",
    material: "Holz- oder Metallrahmen",
    uValueRange: [5.0, 6.0],
    advantages: "Kostengünstig, einfache Konstruktion",
    disadvantages: "Sehr schlechte Wärmedämmung, hohe Energieverluste",
  },
  {
    key: "doublePane",
    label: "Doppelscheibenfenster",
    material: "Luft- oder Gasfüllung",
    uValueRange: [1.1, 2.8],
    advantages: "Bessere Wärmedämmung als Einscheibenfenster",
    disadvantages: "Nicht so effizient wie Dreifachverglasung",
  },
  {
    key: "triplePVC",
    label: "Dreifachverglasung (Kunststofffenster)",
    material: "Kunststoffrahmen mit Mehrkammerprofil",
    uValueRange: [0.8, 1.1],
    advantages: "Preiswert, wartungsarm, gute Dämmung",
    disadvantages: "Geringere Stabilität, weniger langlebig als Holz oder Alu",
  },
  {
    key: "tripleWood",
    label: "Dreifachverglasung (Holzfenster)",
    material: "Massives Holz mit natürlicher Dämmwirkung",
    uValueRange: [0.7, 1.0],
    advantages: "Nachhaltig, natürliche Optik, gute Dämmung",
    disadvantages: "Teurer als Kunststoff, regelmäßige Pflege nötig",
  },
  {
    key: "tripleAlu",
    label: "Dreifachverglasung (Aluminiumfenster)",
    material: "Aluminium mit thermischer Trennung",
    uValueRange: [0.9, 1.2],
    advantages: "Langlebig, witterungsbeständig, moderne Optik",
    disadvantages: "Teuer, schlechtere Dämmwerte als Holz oder Holz-Alu",
  },
  {
    key: "tripleWoodAlu",
    label: "Dreifachverglasung (Holz-Alu-Fenster)",
    material: "Holz innen, Aluminium außen",
    uValueRange: [0.7, 0.9],
    advantages: "Kombiniert Holz-Optik innen mit Witterungsschutz außen",
    disadvantages: "Teuer, aufwendige Herstellung",
  },
  {
    key: "passiveHouse",
    label: "Passivhausfenster",
    material: "Hochwärmedämmende Rahmenkonstruktion",
    uValueRange: [0.5, 0.8],
    advantages: "Optimale Wärmedämmung, hohe Energieeffizienz",
    disadvantages: "Hoher Preis, schwerer Einbau durch großes Gewicht",
  },
  {
    key: "soundproof",
    label: "Schallschutzfenster",
    material: "Besondere Verglasung für hohen Schalldämmwert",
    uValueRange: [1.0, 2.5],
    advantages: "Reduziert Lärm, ideal für laute Umgebungen",
    disadvantages: "Teurer als Standardfenster, aufwendiger Einbau",
  },
  {
    key: "security",
    label: "Sicherheitsfenster",
    material: "Verbundsicherheitsglas mit verstärktem Rahmen",
    uValueRange: [1.1, 2.0],
    advantages: "Erhöhter Einbruchschutz, witterungsbeständig",
    disadvantages: "Hoher Preis, spezielle Anforderungen an Rahmen",
  },
  {
    key: "heritage",
    label: "Denkmalgerechtes Fenster",
    material: "Holz oder Stahl mit authentischen Profilen",
    uValueRange: [1.5, 3.0],
    advantages: "Erhält historische Optik, verbessert Wärmedämmung",
    disadvantages: "Meist teurer als moderne Fenstersysteme",
  },
  {
    key: "smart",
    label: "Intelligentes (elektrochromes) Fenster",
    material: "Spezialglas mit elektronisch steuerbarer Tönung",
    uValueRange: [1.0, 1.8],
    advantages: "Automatische Anpassung an Lichtverhältnisse, spart Energie",
    disadvantages: "Hoher Anschaffungspreis, erfordert Stromversorgung",
  },
];
