import path from "node:path";
import fs from "node:fs/promises";
import { fuelDir } from "../lib/path.ts";
import { generateManifest } from "../lib/generate-file-manifest.ts";


const arrOfFuelFiles = await fs.readdir(fuelDir);
console.log("arrOfFuelFiles", arrOfFuelFiles);

async function generateManifests(files: string[]) {
    const result = await Promise.all(
        files.map((fileName) => {
            const filePath = path.join(fuelDir, fileName);
            return generateManifest(filePath);
        })
    );
    return result;
}

generateManifests(arrOfFuelFiles).catch((err: unknown) => {
    console.log("Manifests generation failed: ", err);
    process.exitCode = 1;
});



// function main() {
    
// }