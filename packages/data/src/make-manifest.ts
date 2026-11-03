import path from 'node:path';
import fs from 'node:fs/promises';
import type { Stats } from 'node:fs';
import crypto from 'node:crypto';
import { error } from 'node:console';
import { unknown } from 'zod';
import { fileURLToPath } from 'node:url';


const sourceUrls = {
    2015: "https://donnees.roulez-eco.fr/opendata/annee/2015",
    2016: "https://donnees.roulez-eco.fr/opendata/annee/2016",
    2017: "https://donnees.roulez-eco.fr/opendata/annee/2017",
    2018: "https://donnees.roulez-eco.fr/opendata/annee/2018",
    2019: "https://donnees.roulez-eco.fr/opendata/annee/2019",
    2020: "https://donnees.roulez-eco.fr/opendata/annee/2020",
    2021: "https://donnees.roulez-eco.fr/opendata/annee/2021",
    2022: "https://donnees.roulez-eco.fr/opendata/annee/2022",
    2023: "https://donnees.roulez-eco.fr/opendata/annee/2023",
    2024: "https://donnees.roulez-eco.fr/opendata/annee/2024",
    2025: "https://donnees.roulez-eco.fr/opendata/annee/2025"
} as const;

type FuelYear = keyof typeof sourceUrls;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "../");
const filePath = path.join(
  projectRoot,
  "/raw/fuel-prices/PrixCarburants_annuel_2015.xml",
);

const statsOfFile: Stats = await fs.stat(filePath);
console.log(statsOfFile.isSocket());
console.log(statsOfFile.size);
console.log(statsOfFile.birthtime);


interface FileManifest {
        // [key: string]: string;
        fileName: string;
        year: FuelYear;
        sourceURL: string;
        downloadedAt: string;
        sizeBytes: number;
        hash: string;
    }

/**
 * Generates metadata for an XML fuel prices file
 * @param value - Absolute path to the XML file 
 * @returns An object containing metadata for the fuel prices manifest
 * including Hash to verify the integrity of the source file
 */
async function generateManifest(filePath: string): Promise<FileManifest> {
    
    // Check if the file is in XML format as expected
    if (path.extname(filePath).toLocaleLowerCase() !== '.xml') {
        throw new Error(`Not an XML file: ${filePath}`);
    }

    // Determine the name of the file and the year
    const fileName = path.basename(filePath);
    const yearMatch = fileName.match(/(\d{4}).xml$/);
    if (!yearMatch) {
        throw new Error (`Cannot determine year from filename: ${fileName}`);
    }
    console.log('YearMAtch: ', yearMatch);
    const year = Number(yearMatch[1]);

    // If there are no expected year in sourceURL variable
    if (!(year in sourceUrls)) {
        throw new Error(`Source URL is missing for Year: ${year}`);
    }
    const fuelYear = year as FuelYear;
    const stats: Stats = await fs.stat(filePath);
    const fileContent = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

    const fileData: FileManifest = {
        fileName,
        year: fuelYear,
        sourceURL: sourceUrls[fuelYear],
        downloadedAt: new Date().toISOString(),
        sizeBytes: stats.size,
        hash,
    }

    console.log(fileData);
    return fileData;
}

generateManifest(filePath).catch((error: unknown) => {
    console.log('Manifest generation failed: ', error);
    process.exitCode = 1;
});


