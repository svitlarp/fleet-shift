import path from "node:path";
import { dataRoot } from "./root-dir.ts";

const rawDir = path.join(dataRoot, "raw");
const manifestsDir = path.join(dataRoot, "manifests");
const parsedDir = path.join(dataRoot, "parsed");
const processedDir = path.join(dataRoot, "processed");
const sourceUrlsDir = path.join(dataRoot, "source-urls");

export const paths = {
  root: dataRoot,
  raw: {
    fuel: path.join(rawDir, "fuel-prices"),
    fuelEntryPointFile: path.join(
      rawDir,
      "fuel-entry-point",
      "PrixCarburants_annuel_2015.xml",
    ),
    irve: path.join(
      rawDir,
      "irve",
      "consolidation_transport_irve_statique.csv",
    ),
    evCatalog: path.join(rawDir, "ev-catalog", "ADEME-CarLabelling.csv"),
  },
  manifests: {
    fuel: path.join(manifestsDir, "fuel-manifest.json"),
    fuelEntryPoint: path.join(manifestsDir, "fuel-manifest-entry-point.json"),
    irve: path.join(manifestsDir, "irve-manifest.json"),
    evCatalog: path.join(manifestsDir, "ev-catalog-manifest.json"),
  },
  parsed: {
    fuel: path.join(parsedDir, "fuel-prices"),
    fuelEntryPointFile: path.join(parsedDir, "lastFuelPriceFor_2015.json"), // "fuel-prices-entry-point.json
    irve: path.join(parsedDir, "irve"),
    evCatalog: path.join(parsedDir, "ev-catalog"),
  },
  demo: {
    estateAgencyFleet: path.join(dataRoot, "demo", "fleet-estate-agency.json"),
  },
  processed: {
    fuel: path.join(processedDir, "fuel-prices-paca-annual.json"),
    irve: path.join(processedDir, "irve-paca-stations.json"),
    evCatalog: path.join(processedDir, "ev-catalog.json"),
  },
  sourceUrls: {
    fuel: path.join(sourceUrlsDir, "fuel-source-urls.json"),
    irve: path.join(sourceUrlsDir, "irve-source-urls.json"),
    evCatalog: path.join(sourceUrlsDir, "ev-catalog-source-urls.json"),
  },
} as const;
