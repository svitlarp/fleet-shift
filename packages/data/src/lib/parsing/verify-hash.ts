import { calculateFileHash } from "../manifest/hash-file.ts";
import path from "node:path";

export async function verifyHash(filePath: string, hash: string): Promise<void> {
    const currentFileHash = await calculateFileHash(filePath);
    if (currentFileHash !== hash) {
        throw new Error(`Hash mismatch for ${path.basename(filePath)}: expected: ${hash}, got ${currentFileHash}`);
    }
    console.log(`Hash verified: ${path.basename(filePath)}: expected: ${hash}, got ${currentFileHash}`);
}