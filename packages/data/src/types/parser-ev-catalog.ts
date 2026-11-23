// --------------  EV Catalog ---------------//

export interface Vehicle {
  id: number | null;
  brand: string | null;
  model: string | null;
  energie: string | null;
  variant: string | null;
  bodyType: string | null;
  segment: string | null;
  priceEur: number | null;
  powerKw: number | null;
  consoElecMin: number | null;
  consoElecMax: number | null;
  kwhPer100km: number | null;
  autonomieMax: number | null;
  autonomieMin: number | null;
  rangeKm: number | null;
  co2GkmMin: number | null;
  co2GkmMax: number | null;
}

export type EVCatalog = Vehicle[];



// Marque;"Libellé modèle";Modèle;Groupe;"Description Commerciale";Energie;Carrosserie;Cylindrée;Gamme;
// "Puissance fiscale";"Puissance maximale";"Puissance nominale électrique";"Poids à vide";
// "Rapport poids-puissance";"Type de boite";"Nombre rapports";"Conso basse vitesse Min";
// "Conso basse vitesse Max";"Conso moyenne vitesse Min";"Conso moyenne vitesse Max";
// "Conso haute vitesse Min";"Conso haute vitesse Max";"Conso T-haute vitesse Min";
// "Conso T-haute vitesse Max";"Conso vitesse mixte Min";"Conso vitesse mixte Max";
// "Conso elec Min";"Conso elec Max";"Autonomie elec Min";"Autonomie elec Max";
// "Autonomie elec urbain Min";"Autonomie elec urbain Max";"CO2 basse vitesse Min";

// "CO2 basse vitesse Max";"CO2 moyenne vitesse Min";"CO2 moyenne vitesse Max";
// "CO2 haute vitesse Min";"CO2 haute vitesse Max";"CO2 T-haute vitesse Min";
// "CO2 T-haute vitesse Max";"CO2 vitesse mixte Min";"CO2 vitesse mixte Max";
// "Essai CO2 type 1";"Essai HC";"Essai Nox";"Essai HCNox";"Essai particules";
// "Masse OM Min";"Masse OM Max";Bonus-Malus;"Barème Bonus-Malus";"Prix véhicule"