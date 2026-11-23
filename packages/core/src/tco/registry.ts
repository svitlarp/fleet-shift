import { energyComponent } from "./components/energy.ts";
import { financingComponent } from "./components/financing.ts";
import { insuranceComponent } from "./components/insurance.ts";
import { maintenanceComponent } from "./components/maintenance.ts";
import { residualComponent } from "./components/residual.ts";
import type { TcoComponent } from "./types.ts";

/** Add a new cost (VAT, malus, CEE, charger) by appending its component here. */
export const DEFAULT_TCO_COMPONENTS: readonly TcoComponent[] = [
  financingComponent,
  energyComponent,
  maintenanceComponent,
  insuranceComponent,
  residualComponent,
];
