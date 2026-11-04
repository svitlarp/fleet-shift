import path from "node:path";
import { fileURLToPath } from "node:url";


export const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(currentDir, "../../");

// An absolute path to the fuel-prices folder with all raw XML
export const fuelDir = path.join(projectRoot, "raw/fuel-prices");
console.log("fuelDir", fuelDir);

