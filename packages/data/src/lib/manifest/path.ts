import path from "node:path";
import { fileURLToPath } from "node:url";


export const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(currentDir, "../../../");

